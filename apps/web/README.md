# BarBellix — Web Dashboard

The staff-only management dashboard for gym owners (`admin`/`superadmin`) and trainers. Vite +
React, Tailwind + shadcn/ui, MobX for state, TanStack Query for server state.

See the [root README](../../README.md) for monorepo-wide setup, roles, and quick start. To run
just this app:

```bash
cp .env.example .env
npm run dev --workspace=@barbellix/web   # :5173
```

## Tooling notes

This app is built with Vite's React template using [Oxlint](https://oxc.rs) instead of ESLint. To
enable type-aware lint rules, install `oxlint-tsgolint` and add to `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full
rule list.
