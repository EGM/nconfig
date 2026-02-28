# Migration Guide

## Purpose of migrations

Migrations reshape configuration data from an older schema version into the structure required by the current version. They ensure that users with older config files can upgrade seamlessly without rewriting anything manually. Each migration handles exactly one version step and is responsible only for structural evolution, not validation or business logic.

## When to create a migration

A migration is required whenever the schema changes in a way that makes older configs incompatible with the new shape. Typical triggers include:

- Adding a new required field.
- Renaming a field.
- Moving a field into a nested object.
- Changing a field’s type.
- Removing a deprecated field.
- Splitting one field into multiple fields.
- Merging multiple fields into one.

If the schema change is purely additive and the new field has a default applied during validation, a migration may not be necessary. Any change that breaks older configs or changes meaning requires a migration.

## Principles of migration functions

Migration functions follow a strict set of rules to keep the system predictable and testable.

- Pure — no side effects, no I/O, no mutation.
- Deterministic — same input always produces the same output.
- Single-step — each function upgrades exactly one version.
- Isolated — no branching, no skipping versions.
- Structural — responsible only for reshaping data, not validating it.
- Version-bumping — must set the new `version` field explicitly.

These constraints keep migrations simple and ensure the upgrade loop remains linear and reliable.

## Anatomy of a migration function

A migration function accepts a config object at version *X* and returns a new object at version *X+1*.

```TS
function migrate_1_0_to_1_1(oldConfig: any): any {
  return {
    version: "1.1",
    ...transformedFields
  };
}
```

A migration function typically performs one or more of the following:

- Copying values from old fields to new fields.
- Adding new fields with default values.
- Removing deprecated fields.
- Restructuring nested objects.
- Converting types (e.g., string → number).

It must never mutate  directly.

## Updating the migration registry

Every migration must be added to the registry so the upgrade loop can find it.

```TS
const migrations = {
  "1.0": migrate_1_0_to_1_1,
  "1.1": migrate_1_1_to_1_2,
};
```

The registry must remain linear. Each key maps to exactly one next version. When adding a new migration:

1. Write the migration function.
2. Add it to the registry.
3. Update  to the new version.

No other part of the system needs to change.

## The upgrade loop

The upgrade loop walks the config forward through each version until it reaches the current schema version.

```TS
while (config.version !== CONFIG_VERSION):
    config = migrations[config.version](config)
```

The loop guarantees:

- No version is skipped.
- Every migration is applied in order.
- The final config is always at the correct version.

If a version is unknown or unsupported, the loop throws a clear error.

## Writing a migration: a practical example

Suppose the schema changes from:

```JSON
{
  "version": "1.0",
  "logLevel": "info"
}
```

to:

```JSON
{
  "version": "1.1",
  "logging": {
    "level": "info"
  }
}
```

The migration function is:

```TS
function migrate_1_0_to_1_1(old: any): any {
  return {
    version: "1.1",
    logging: {
      level: old.logLevel ?? "info"
    }
  };
}
```

Then update the registry:

```TS
migrations["1.0"] = migrate_1_0_to_1_1;
CONFIG_VERSION = "1.1";
```

That’s the entire process.

## Testing migrations

Each migration should have a dedicated test that verifies:

- The input version matches the expected old version.
- The output version is correct.
- All fields are transformed correctly.
- No unexpected fields remain.
- No mutation occurs.

A simple test structure:

```TS
Deno.test("migrate 1.0 → 1.1", () => {
  const input = { version: "1.0", logLevel: "debug" };
  const output = migrate_1_0_to_1_1(input);

  assertEquals(output.version, "1.1");
  assertEquals(output.logging.level, "debug");
  assertNotStrictEquals(output, input);
});
```

Tests ensure migrations remain stable as the schema evolves.

## Migration lifecycle

When the schema evolves:

1. Identify the structural changes.
2. Write a migration function for the version step.
3. Add the migration to the registry.
4. Bump .
5. Add or update validation rules.
6. Write tests for the migration.
7. Commit the changes.

This lifecycle keeps the system predictable and maintainable.

## Summary

Migrations are the mechanism that keeps nconfig backward-compatible and future-proof. By following a linear, pure, deterministic approach, nconfig ensures that any configuration file—no matter how old—can be upgraded to the latest schema safely and automatically.
