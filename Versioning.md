# Versioning Specification

This document defines how configuration versioning, schema evolution, and migration work inside nconfig. It describes the responsibilities of the versioning system, how versions are compared, how migrations are applied, and how the loader guarantees that all configuration objects reach the correct schema version before validation.

Versioning is a core part of nconfig’s design. It ensures that configuration files created under older schema versions continue to work as the schema evolves, without requiring users to manually rewrite their config files.

## Goals of the Versioning System

The versioning system is designed to:

- Maintain backward compatibility for older configuration files.
- Provide a deterministic upgrade path from any known version to the current schema.
- Keep nconfig runtime‑agnostic, side‑effect‑free, and easy to embed.
- Ensure that validation always runs against the latest schema version.
- Keep migration logic simple, linear, and testable.
Versioning is intentionally small and self‑contained. nconfig does not know or care about plugins, applications, or external ecosystems. It only manages its own schema.

## Version Field

Every configuration file must contain a top‑level field:

```json
{
  "version": "1.0",
  ...
}
```

This field identifies the schema version the configuration file conforms to.
Rules:

- The version must be a string.
- The version must match a known version in the migration registry or the current schema version.
- Missing or invalid version fields cause the loader to throw a parsing error.

## Schema Version Constant

nconfig defines a single authoritative constant:

```TS
const CONFIG_VERSION = "1.0";
```

This value represents the latest schema version that the loader expects.
Whenever the schema changes:

1. A new migration function is added.
2. The migration registry is updated.
3. is bumped to the new version.
This constant is the source of truth for version comparison.

## Migration Registry

The migration registry is a linear mapping of:

```TS
old version → migration function
```

Example:

```TS
const migrations = {
  "1.0": migrate_1_0_to_1_1,
  "1.1": migrate_1_1_to_1_2,
  "1.2": migrate_1_2_to_1_3
};
```

Rules:

- Each key represents a current version.
- Each value is a function that upgrades to the next version.
- The registry must be linear—no branching, no skipping versions.
- Migration functions must be pure and side‑effect‑free.
The registry defines the entire schema evolution history.

## Migration Functions

A migration function transforms a configuration object from version X to version X+1.
Example shape:

```TS
function migrate_1_0_to_1_1(oldConfig) {
  return {
    version: "1.1",
    ...transformedFields
  };
}
```

Migration functions:

- Must not mutate the input.
- Must return a new object.
- Must set the new  field.
- May add, remove, rename, or restructure fields.
- Must not perform I/O or depend on external state.
Each migration function handles exactly one version step.

## Version Comparison

After parsing the raw configuration file into a JavaScript object, nconfig extracts the version and compares it to .
Outcomes:

- Equal → no migration needed.
- Older → run migration loop.
- Newer → throw an error (config created by a newer nconfig version).
- Unknown → throw an error (no migration path exists).
This ensures that only valid, known versions enter the migration pipeline.

## Migration Loop

The migration loop upgrades the configuration step‑by‑step until it reaches the latest schema version.
Conceptual flow:

```TS
current = parsedConfig
while current.version !== CONFIG_VERSION:
    fn = migrations[current.version]
    if fn does not exist:
        throw error
    current = fn(current)
return current
```

Properties:

- Deterministic.
- Linear.
- Guaranteed to terminate.
- Easy to test.
- Produces a config object at the correct schema version.
The loop is the core of the versioning engine.

## Validation After Migration

Once the configuration object reaches the latest schema version, it is passed to the schema validator (Zod).
Validation:

- Ensures required fields exist.
- Ensures types are correct.
- Applies defaults.
- Strips unknown fields.
- Produces a fully typed, safe configuration object.
Validation must occur after migration, never before.

## Return Value

The loader returns:

```TS
{
  config: <validated config object>,
  wasMigrated: boolean
}
```

 indicates whether any migration functions were applied.
This is useful for:

- logging
- debugging
- CLI tools
- user feedback

## Error Conditions

The loader throws a  when:

- The config is missing a  field.
- The version is not a string.
- The version is newer than .
- The version is unknown and no migration exists.
- A migration function fails.
- The final config fails validation.
These errors are explicit and actionable.

## Design Principles

The versioning system follows these principles:

- Purity — no side effects, no mutation.
- Determinism — same input always produces same output.
- Linearity — one migration per version step.
- Isolation — versioning is independent of parsing and validation.
- Minimalism — no external dependencies, no runtime complexity.
- Predictability — clear upgrade paths, clear error messages.
This keeps nconfig small, reliable, and easy to embed in any environment.
