**Report generated:** 2026-11-24 08:00:04 CET
**Adapter:** ioBroker.wireguard-s2s
**Version reviewed:** 0.5.1 plus proposed corrections at commit a9f1a5525711d9b423fe444b972f9d767503250b
**Repository:** https://github.com/System-9/ioBroker.wireguard-s2s (tag: none for reviewed commit; released baseline v0.5.1)
**Previous review:** none supplied as a standalone report; historical checker feedback in ioBroker/ioBroker.repositories#6679 and System-9/ioBroker.wireguard-s2s#16 considered
**Checklist version:** ioBroker Adapter Checklist V3.5
**Skill version:** 1.21.0
**Reviewer:** GPT-6 Astra / automated review

## Status of Previous Review Findings

No previous standalone review report was supplied. Historical checker findings were verified:

- Missing object-name translations: fixed; all 23 declared objects have all 11 recommended languages.
- Missing npm collaborator `bluefox`: fixed; `npm owner ls iobroker.wireguard-s2s` lists `bluefox` and `system9`.
- Missing LATEST inclusion (W4001): still pending in [ioBroker/ioBroker.repositories#7057](https://github.com/ioBroker/ioBroker.repositories/pull/7057). The checker explicitly allows this warning while an inclusion PR exists.

This review started at main commit `13623e6aa6fa29d2cbb4fd36547c83eb07d5b2c0`. Corrections identified during the review are proposed in [adapter PR #24](https://github.com/System-9/ioBroker.wireguard-s2s/pull/24), at the reviewed commit above. They are not yet part of main or a published npm release:

- Replaced overlapping interval polling with completion-based adapter-managed timeouts; polling shares the control-action queue.
- Caught startup, polling and control-finalization promise rejections and prevented queued control actions from starting after unload.
- Aligned numeric UDP-port metadata with role `value`, peer connectivity with `indicator.reachable`, and handshake duration with unit `s`.
- Aligned the author name, moved developer instructions to `DEVELOPMENT.md`, and corrected the documented temporary configuration directory.
- Removed four unused translation keys in all 11 languages and corrected selected UI mistranslations.
- Updated the locked transitive packages `follow-redirects`, `moment` and `node-forge`; production-only npm audit now reports no vulnerabilities.

## Full Re-Review Results (Checklist V3.5)

#### ✅ PASS items

- [x] README functionality and user guidance: English documentation covers configuration, controls, topology, routing, keys and connection status; WireGuard product link and MIT license link are present.
- [x] Documentation organization: substantial contributor instructions are in `DEVELOPMENT.md`; English secondary documentation is present; no paid-feature requirement was found.
- [x] Adapter installation guidance: no direct GitHub or raw npm installation of the adapter is recommended. Privileged helper installation is evaluated separately below.
- [x] Icon: custom shield/link SVG; actual format matches the `.svg` extension and it is not the adapter-creator icon.
- [x] Package and adapter metadata: matching name/version/license; Node.js >=22; daemon/local/poll/network classifications match implementation; official package and jsonConfig schema checks pass.
- [x] Author and license consistency: author name and syntactically valid contact address agree across package metadata, README and LICENSE; MIT and free license information are present.
- [x] Installation lifecycle scripts: no npm install/prepare hook executes adapter setup. Helper installation commands are explicit manual scripts, assessed below.
- [x] TypeScript source layout: implementation in `src/`, generated output in `build/`, and `main` points to `build/main.js`; generated artifacts were rebuilt.
- [x] Object IDs and namespaces: 23 static objects, English IDs, no case-insensitive collisions, no foreign/system object mutation and no externally constructed object IDs.
- [x] Object hierarchy: three channels and twenty states; all parent channels exist; no device under channel or children under states.
- [x] Dynamic object validation: no runtime object creation paths were found; configuration and helper data update only the declared states.
- [x] Object deletion/custom protection: no ioBroker object deletion paths were found.
- [x] State roles and attributes: checked against the live official state-role reference; corrected roles/units match state types and read/write flags. Write-only action buttons correctly retain role `button`.
- [x] Writable-state handling: `control.apply`, `control.down` and `control.refresh` are subscribed and handled; acknowledged writes are ignored and processed buttons are reset with acknowledgement.
- [x] Names, descriptions and metadata translations: all eleven language keys are present; no clearly untranslated English sentence copies were found. Product-title variation is noted below.
- [x] Admin UI translations: 33 used translation keys in each of eleven languages; no unused keys remain; jsonConfig uses the standard Admin language.
- [x] adminTab: Not present — nothing to check.
- [x] Custom UI, vis and templates: no custom component, separate web UI, vis widgets or user templates requiring additional translation were found.
- [x] Logs and user-facing source literals: English; no translation of logs or non-English object-property heuristics found.
- [x] Network access: no adapter HTTP/cloud client or cloud polling; subprocess operations have fixed timeouts. Scheduled-cloud randomization requirements do not apply to this local daemon.
- [x] Timer validation and lifecycle: polling interval validated as an integer from 5 to 3600 seconds, well below the timer limit; helper deadlines are bounded; adapter timers are cancelled on unload.
- [x] Async error containment and poll serialization: six regression tests exercise slow polling, control/poll ordering, failed status writes, failed button resets, unload and startup rejection.
- [x] Sensitive configuration handling: private/preshared keys are protected and encrypted; no direct logging of keys/configuration was found; helper status omits private and preshared key fields.
- [x] Runtime code integrity: no package-tree self-modification, runtime npm commands or executable downloads found; no direct access to ioBroker's internal Redis database.
- [x] Bundled executable format: no precompiled binary executables found; the privileged helper and installers are source scripts.
- [x] Configuration usage and code structure: native fields are used by the configuration UI/runtime; registered handlers have implemented responsibilities; json2iob is not used.
- [x] Static object fixture: all 23 object definitions match the corrected metadata. Fresh runtime provenance is evaluated below.
- [x] Local verification: type check, lint, build, 11 TypeScript tests, 12 helper/lifecycle tests, 61 package/schema checks, one integration startup test and helper/installer syntax checks passed on macOS with Node.js v22.22.0.
- [x] Production dependency audit: `npm audit --omit=dev` reports zero vulnerabilities for the corrected lockfile.

#### 🔴 ACTIONABLE FINDINGS

#### Privileged helper architecture conflicts with the checklist

- [ ] Resolve the checklist prohibition on sudo and subprocess scripts with the ioBroker maintainers.

`src/lib/helper-client.ts:17-23,55` starts `/usr/local/libexec/iobroker-wireguard-s2s-helper` using non-interactive `sudo`. `scripts/install-helper.sh:12-14,37-46` installs a root-owned copy and a sudoers rule. `README.md:38-66,138-147` explicitly documents this privileged installation and execution model.

The adapter uses argument arrays without a shell; the helper validates input, restricts interface names, checks ownership and executes fixed system binaries. These controls do not make the architecture conform to the linked checklist's blanket prohibition. Removing sudo without a replacement would remove the adapter's core host-network configuration functionality. Maintainers should explicitly assess whether this design is acceptable or require a separately managed service/API architecture. This is a confirmed checklist deviation, not a demonstrated arbitrary-command injection.

#### Fresh object export from the corrected running adapter is missing

- [ ] Attach a sanitized object export from a working Linux installation after applying the corrections.

The [existing PR attachment](https://github.com/user-attachments/files/34257836/wireguard-s2s-object-dump.json) contains 23 objects and originally matched the repository fixture exactly. Its newest object timestamp is **2026-09-15 09:52:25.563 UTC**. Previous PR comments explain that its names were synchronized later; the timestamps do not establish a fresh installation export.

The corrected `wireguard-s2s-object-dump.json` now reflects three role/unit changes in `io-package.json`. This is a synchronized structure fixture, **not a newly exported live dump**; the original timestamps were preserved. A fresh export must confirm the actual installed objects and their updated attributes. This review environment has no configured Linux WireGuard installation from which to produce it.

#### Development-tool dependency vulnerabilities remain

- [ ] Review/update the development toolchain dependencies and track upstream packages without fixes.

After the targeted production dependency updates, the full `npm audit` still reports **37 vulnerable packages** in the development dependency graph. Affected paths include `request`/`form-data` and packages reached through ioBroker testing/development tools. Audit marks some paths as having no available fix; other proposed fixes include changing tooling versions.

Production-only audit is clean. The full audit findings should nevertheless be addressed for development/CI usage through compatible upstream updates or documented applicability assessment. No forced major-version changes or blanket dependency overrides were applied, and exploitability of every transitive advisory was not established by this source review.

#### ⚠️ OBSERVATIONS

#### Runtime validation boundary

The integration test verified adapter startup and shutdown with the helper unavailable; it did not configure a real tunnel. The helper correctly failed with a non-interactive sudo error in this macOS environment. Real Linux routing, forwarding, privilege separation and WireGuard connectivity need testing on a disposable Linux host. Source review and schema tests are not substitutes for that end-to-end validation.

#### Product-title translations

`io-package.json` uses the brand-style “WireGuard Site-to-Site” unchanged for English, German and Ukrainian and translated variants in other languages. Either translate all descriptive entries or consistently use the brand-style value. This is not classified as an untranslated-sentence error.

#### Temporary secret-file cleanup

The helper removes its private temporary directory in `finally` during normal completion and handled errors. Abrupt process termination can bypass that cleanup. Files are created with mode `0600` in a mode `0700` directory under `/etc/wireguard`; consider documenting recovery/cleanup of stale temporary files or designing crash-safe secret handling.

#### Review provenance and scope

The review used the [requested skill v1.21.0](https://github.com/iobroker-bot-orga/myClaude/blob/main/Skills/review-adapter-for-io-broker/SKILL.md), the live [io-package schema](https://github.com/ioBroker/ioBroker.js-controller/blob/master/schemas/io-package.json), and the live [state-role reference](https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/stateroles.md). The actual reviewer is identified in the header rather than copying the template's Claude model name. Generated build output, dependency sources and lockfile contents were not used as source-review evidence; build, dependency-audit and regression-test tools were run separately.
