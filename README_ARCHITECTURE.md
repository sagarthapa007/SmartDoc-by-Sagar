# SmartDoc Enterprise — Phase 2 Ready (Modular, Plug-and-Play)

## Run
```
npm install
npm run dev
```

## Philosophy
- Each feature lives as a **module** under `src/modules/<feature>`.
- Modules are **self-contained** (UI + minimal logic) and do not replace core files.
- `Analyze.jsx` renders `<ModulesHub/>` which exposes Catalog, Compare, Controls, Export, Reports, History, Email.

## Integration Points
- Add new route: `src/components/layout/Container.jsx`
- Add new module: drop a folder under `src/modules/<name>` and reference it in `ModulesHub.jsx` (or wire a dynamic loader later).
- Share state safely via contexts in `src/context/*` (no localStorage).

## Upgrade Path
- Extend, never replace. New utilities go beside existing ones.
- For advanced exports: implement PDF/PPT/HTML engines under `src/modules/export/` using the existing stubs.
- For multi-sheet compare: extend `ingest.js` to load all sheets and expose `files[]` entries per sheet.
