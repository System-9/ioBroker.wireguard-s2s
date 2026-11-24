# Development

The project uses the official `@iobroker/create-adapter` TypeScript/JSONConfig template.
Source files are in `src/`; `npm run build` regenerates the tracked `build/` files.

## Checks

```bash
npm run check
npm run lint
npm run test
npm run test:integration
npm run coverage
node --check helper/iobroker-wireguard-s2s-helper.js
```

Unit tests cover configuration normalization, endpoint formatting, keys and the rejection
of command-style interface names and default routes. The integration test starts the
adapter in the standard ioBroker test harness. End-to-end WireGuard network tests require
a disposable Linux network namespace or virtual machine and root permissions.

## Releases

Use `npm run release` to prepare releases after npm trusted publishing and the deploy job
in `.github/workflows/test-and-release.yml` have been configured.
