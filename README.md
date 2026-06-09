# WSTech Visual Table Builder

Official source code for the WSTech Visual Table Builder WordPress plugin.

## Source and build

- Editable block source is in `src/`.
- Compiled WordPress block assets are generated into `build/`.
- Build tooling is defined in `package.json` and uses `@wordpress/scripts`.

To rebuild the production assets:

```bash
npm install
npm run build
```
