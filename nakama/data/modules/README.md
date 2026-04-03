# Nakama Modules

`runtime.ts` is the single source of truth for the Nakama JavaScript runtime.

Why it is structured this way:

- Nakama's JavaScript loader is strict about how match hooks and RPC handlers are declared.
- The build compiles `runtime.ts` into `build/index.js` as a plain script so Nakama can discover `InitModule`, match hooks, and RPC handlers reliably.
- The older modular server files were removed to avoid code drift between "source" and the actual runtime artifact.

Useful commands:

```bash
cd nakama/data/modules
npm install
npm run build
```

This generates `build/index.js`, which is what the Docker Compose stack mounts into the Nakama container.
