# Migration from v2 to v3

- NConfig is no longer a class.
- Added new `createConfig()` exported method, which is the new way of calling `new NConfig().parse()`.
- You can use `configYaml()`, `configToml()` and `configJson()` respectively to parse YAML, TOML and JSON files, just as before.
- `js-yaml` and `toml` are now dynamically imported which means, for example, installing `toml` when only using `yaml` is no longer necessary.
- Fixed detection of default `config.yaml` file.

## v2.1 (Deno Edition)

- Retooled to run under Deno, and get all dependencies from JSR.io
- Added `configIni()` and `configXml()` respectively to parse INI and XML files. *Note:* XML configurations must be within an outer &lt;config&gt; set of tags.
- Most of `createConfig()` and the `config*()` sub parts changed to async functions.
- Added `configJsonc()` to parse JSONC files.
