# Loading and Saving Configuration Files

This document describes how nconfig loads, migrates, validates, and saves configuration files. Both operations share the same principles: deterministic behavior, explicit control, and format‑driven parsing/serialization. Understanding them together provides a complete picture of the configuration lifecycle.

## Loading Overview

Loading a configuration file follows a strict seven‑step pipeline:

- Read file
- Detect format based on filename extension
- Parse raw text → JavaScript object
- Verify version
- Migrate (if needed)
- Validate using a Zod schema
- Return the final typed config object

This pipeline ensures that any configuration file—no matter how old—can be upgraded to the latest schema version and validated before use.

## Supported formats

nconfig supports:

- YAML (.yml, .yaml)
- JSON (.json)
- JSONC (.jsonc)
- TOML (.toml)
- INI (.ini)
- XML (.xml)

The filename extension determines which parser is used. Unsupported extensions produce a clear error listing the supported formats.

## Default filename

If no filename is provided, nconfig searches the current working directory for:
config.json
config.jsonc
config.ini
config.toml
config.xml
config.yaml
config.yml

The first match becomes the config file. If none exist, loading fails with an explicit error.

## Versioning During Load

Every configuration file must contain a top‑level version field:

```json
{
  "version": "1.0"
}
```

nconfig compares this value to the internal CONFIG_VERSION constant.

## Version outcomes

- Equal → no migration needed
- Older → run migration loop
- Newer → error (config created by a newer nconfig version)
- Unknown → error (no migration path exists)

## Migration loop

Migrations are defined in a linear registry:

```TS
const migrations = {
  "1.0": migrate_1_0_to_1_1,
  "1.1": migrate_1_1_to_1_2
};
```

The loader applies each migration in order until the config reaches the latest schema version. Migration functions are pure, deterministic, and responsible only for structural changes.

## Validation

After migration, the config is validated using the provided Zod schema. Validation ensures:

- required fields exist
- types are correct
- defaults are applied
- unknown fields are removed

The loader returns:

```TS
{
  config: <validated config>,
  wasMigrated: boolean
}
```

## Saving Overview

Saving a configuration file is an explicit operation. nconfig never writes files automatically. Saving is performed through:

```TS
saveConfig(config, { schema?, filename? })
```

## Filename rules

- If filename is provided with an extension → use that format.
- If filename is provided without an extension → append .yml.
- If filename is omitted → use config.yml.
- Unsupported extensions produce a clear error listing supported formats.

## Validation rules

- If schema is provided → validate before writing.
- If schema is omitted → skip validation.
- The config must contain a valid version field.

This allows saving both validated configs and user‑constructed configs.

## Serialization rules

Serialization is format‑driven:

- YAML — two‑space indentation, minimal whitespace
- TOML — compact tables, minimal whitespace
- JSON / JSONC — compact (JSON.stringify)
- INI — compact
- XML — two‑space indentation

No comments, no pretty‑printing, no stylistic formatting beyond what the syntax requires.

## Key ordering

- If no schema is provided → preserve the key order of the input object.
- If a schema is provided → the validated object’s key order becomes canonical.

This keeps saving transparent and predictable.

## Loading and Saving Together

Loading and saving form a complete lifecycle:

```json
load → migrate → validate → use → save
```

Key guarantees:

- Loading always returns a config at the latest schema version.
- Saving always writes a structurally valid config (if schema is provided).
- Filename determines format for both loading and saving.
- No hidden state is tracked between load and save.
- No automatic writes occur during loading.

This design keeps nconfig deterministic, explicit, and easy to embed in any environment.

## Summary

- Loading is a structured 7‑step pipeline with versioning and validation.
- Saving is explicit, format‑driven, and optionally validated.
- Both operations rely on filename extensions to determine format.
- Versioning ensures backward compatibility.
- Key order is preserved unless schema validation rewrites it.
- Two‑space indentation is used for hierarchical formats.
- No automatic behavior is introduced at any point.
