/* 
Steps:
  1. Read file
  2. Detect format
  3. Translate raw -> JSON
  4. Verify version
  5. Migrate (if needed)
  6. Validate schema
  7. Return final config object
*/

import { z } from "@zod/zod";
import { exists } from "@cross/fs/stat";
import { cwd } from "@cross/fs/ops";
import { readFile } from "@cross/fs/io";
import { join } from "@std/path";
import { ConfigParsingError } from "./errors.ts";
import { getLogger } from "./logger.ts";
import type { ParseOptions } from "./types.ts";


// -----------------------------
// Versioning Infrastructure
// -----------------------------

const CONFIG_VERSION = "1.0";

// Example registry (empty for now; add migrations as schema evolves)
const migrations: Record<string, (c: any) => any> = {
  // "1.0": migrate_1_0_to_1_1,
  // "1.1": migrate_1_1_to_1_2,
};

// Extract version safely
function getVersion(obj: unknown): string {
  if (!obj || typeof obj !== "object") {
    throw new ConfigParsingError("Config must be an object.");
  }
  const v = (obj as any).version;
  if (typeof v !== "string") {
    throw new ConfigParsingError("Config is missing a valid 'version' field.");
  }
  return v;
}

// Migration loop
function migrateIfNeeded(obj: any, latest: string): { config: any; wasMigrated: boolean } {
  
  let current = obj;
  let version = getVersion(current);
  let migrated = false;

  if (version > latest) {
    throw new ConfigParsingError(
      `Config version ${version} is newer than supported version ${latest}.`,
    );
  }

  while (version !== latest) {
    const fn = migrations[version];
    if (!fn) {
      throw new ConfigParsingError(`No migration available for version ${version}.`);
    }
    current = fn(current);
    version = getVersion(current);
    migrated = true;
  }

  return { config: current, wasMigrated: migrated };
}

// -----------------------------
// Main createConfig Function
// -----------------------------

export async function createConfig<S extends z.ZodType<any>>(
  schema: S,
  { filePath, logger }: ParseOptions = {},
): Promise<{ config: z.infer<S>; wasMigrated: boolean }> {

  const log = getLogger( logger );
  
  // Guard #1: No filepath
  filePath ??= await tryGetDefaultConfigPath();
  if (!filePath) {
    throw new ConfigParsingError(
      "No file path provided and could not auto-determine file path.",
    );
  }

  // Guard #2: File doesn't exist
  const fileExists = await exists(filePath);
  if (!fileExists) {
    throw new ConfigParsingError("The file provided does not exist.");
  }
  // Step 1: Read file
  const rawString = await readFile(filePath, { encoding: "utf8" });

  // Step 2: Detect format
  const extension = String(filePath).split(".").pop()?.toLowerCase();

  const parsers: Record<string, (r: string) => any | Promise<any>> = {
    ini: createConfigIni,
    json: createConfigJson,
    jsonc: createConfigJsonc,
    yml: createConfigYaml,
    yaml: createConfigYaml,
    toml: createConfigToml,
    xml: createConfigXml,
  };

  // Guard #3: Unsupported extension
  const parser = parsers[extension!];
  if (!parser) {
    throw new ConfigParsingError(
      `Unsupported extension ".${extension}" provided to parse().`,
    );
  }

  // Step 3: Translate raw -> JSON
  const parsed = await parser(rawString);

  // Step 4 & 5: Versioning (verify + migrate)
  const { config: upgraded, wasMigrated } = migrateIfNeeded(parsed, CONFIG_VERSION);

  // Step 6: Validate schema
  const validated = schema.parse(upgraded);

  // Step 7: Return final config + migration flag
  return { config: validated, wasMigrated };
}

// -----------------------------
// Parsers
// -----------------------------

export async function createConfigYaml(rawString: string): Promise<unknown> {
  const yaml = await import("@std/yaml");
  return yaml.parse(rawString);
}

export async function createConfigToml(rawString: string): Promise<unknown> {
  const toml = await import("@std/toml");
  return toml.parse(rawString);
}

export async function createConfigJsonc(rawString: string): Promise<unknown> {
  const jsonc = await import("@std/jsonc");
  return jsonc.parse(rawString);
}

export function createConfigJson(rawString: string): Promise<unknown> {
  return JSON.parse(rawString);
}

export async function createConfigIni(rawString: string): Promise<unknown> {
  const ini = await import("@std/ini");
  return ini.parse(rawString);
}

export async function createConfigXml(rawString: string): Promise<unknown> {
  const xml = await import("@libs/xml");
  return xml.parse(rawString).config;
}

// -----------------------------
// Default Path Resolver
// -----------------------------

async function tryGetDefaultConfigPath(): Promise<string | undefined> {
  const log = getLogger(undefined);
  const base = cwd();
  const candidates = [
    "config.yml",
    "config.yaml",
    "config.toml",
    "config.json",
    "config.jsonc",
    "config.xml",
    "config.ini",
  ];

  for (const name of candidates) {
    const full = join(base, name);
    if (await exists(full)) return full;
  }

  return undefined;
}