const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Exercise the real adapter lifecycle with deterministic timers and no host/network access.
function createAdapter() {
    const timers = new Map();
    const errors = [];
    let nextTimer = 0;
    class Adapter extends EventEmitter {
        namespace = "wireguard-s2s.0";
        config = {};
        log = { error: message => errors.push(message), warn() {}, info() {} };
        setTimeout(callback) {
            const id = ++nextTimer;
            timers.set(id, callback);
            return id;
        }
        clearTimeout(id) {
            timers.delete(id);
        }
        async setStateAsync() {}
        setState(_id, _value, _ack, callback) {
            callback();
        }
        subscribeStates() {}
    }
    class HelperClient {
        close() {}
    }
    const module = { exports: {} };
    const source = fs.readFileSync(path.join(__dirname, "../src/main.ts"), "utf8");
    const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const dependencies = {
        "@iobroker/adapter-core": { Adapter },
        "./lib/helper-client": { HelperClient },
        "./lib/config": { validateConfig: () => ({ pollInterval: 5, helperConfig: {} }) },
        "./lib/keys": {},
        "./lib/message-security": {},
    };
    vm.runInNewContext(compiled, {
        Error,
        module,
        exports: module.exports,
        require: name => {
            assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
            return dependencies[name];
        },
    });
    const adapter = module.exports();
    adapter.validated = { pollInterval: 5, helperConfig: {} };
    return {
        adapter,
        timers,
        errors,
        fireTimer() {
            const [id, callback] = timers.entries().next().value;
            timers.delete(id);
            callback();
        },
    };
}

test("polling waits for a slow operation and schedules the next poll only after completion", async () => {
    const { adapter, timers, fireTimer } = createAdapter();
    let finish;
    let polls = 0;
    adapter.refreshStatus = () => {
        polls++;
        return new Promise(resolve => { finish = resolve; });
    };
    adapter.startPolling();
    fireTimer();
    await Promise.resolve();
    assert.equal(polls, 1);
    assert.equal(timers.size, 0);
    finish();
    await adapter.operationChain;
    assert.equal(timers.size, 1);
});

test("polling queues behind control actions instead of racing a tunnel change", async () => {
    const { adapter, fireTimer } = createAdapter();
    const calls = [];
    let finish;
    adapter.applyConfiguration = () => {
        calls.push("apply");
        return new Promise(resolve => { finish = resolve; });
    };
    adapter.refreshStatus = async () => { calls.push("status"); };
    adapter.onStateChange("wireguard-s2s.0.control.apply", { ack: false, val: true });
    adapter.startPolling();
    fireTimer();
    await Promise.resolve();
    assert.deepEqual(calls, ["apply"]);
    finish();
    await adapter.operationChain;
    assert.deepEqual(calls, ["apply", "status"]);
});

test("state-write failures during polling are handled and polling can recover", async () => {
    const { adapter, timers, errors, fireTimer } = createAdapter();
    adapter.helper.status = async () => { throw new Error("helper unavailable"); };
    adapter.setStateAsync = async () => { throw new Error("state database unavailable"); };
    adapter.startPolling();
    fireTimer();
    await adapter.operationChain;
    assert.match(errors[0], /Could not refresh WireGuard status: state database unavailable/);
    assert.equal(timers.size, 1);
});

test("button reset rejection is handled and subsequent actions still execute", async () => {
    const { adapter, errors } = createAdapter();
    let actions = 0;
    adapter.applyConfiguration = async () => { actions++; };
    adapter.setStateAsync = async () => { throw new Error("reset failed"); };
    for (let i = 0; i < 2; i++) {
        adapter.onStateChange("wireguard-s2s.0.control.apply", { ack: false, val: true });
        await adapter.operationChain;
    }
    assert.equal(actions, 2);
    assert.equal(errors.length, 2);
    assert.match(errors[0], /Could not finish WireGuard control action: reset failed/);
});

test("unload cancels polling and prevents queued actions from starting", async () => {
    const { adapter, timers } = createAdapter();
    let actions = 0;
    let unloaded = false;
    adapter.applyConfiguration = async () => { actions++; };
    adapter.onStateChange("wireguard-s2s.0.control.apply", { ack: false, val: true });
    adapter.startPolling();
    adapter.onUnload(() => { unloaded = true; });
    await adapter.operationChain;
    adapter.startPolling();
    assert.equal(actions, 0);
    assert.equal(timers.size, 0);
    assert.equal(unloaded, true);
});

test("startup rejection is caught at the ready event boundary", async () => {
    const { adapter, errors } = createAdapter();
    adapter.setStateAsync = async () => { throw new Error("startup database unavailable"); };
    adapter.emit("ready");
    await new Promise(resolve => setImmediate(resolve));
    assert.match(errors[0], /Adapter startup failed: startup database unavailable/);
});
