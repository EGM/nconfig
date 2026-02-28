import { ConfigParsingError } from "./errors.ts";
import type { SaveOptions, WriteFileFn } from "./types.ts";
import { getLogger } from "./logger.ts";

export async function saveConfig(
  config: unknown,
  options: SaveOptions = {},
  deps?: { writeFile: WriteFileFn },
): Promise<void> {

  const writeFile = deps?.writeFile ?? (await import("@cross/fs/io")).writeFile;
  const { schema } = options;
  let { filePath } = options;
  const log = getLogger(options.logger)

  // -----------------------------
  // Step 1: Determine filename
  // -----------------------------
  if (!filePath) {
    filePath = "config.yml";
  }

  // If filename has no extension, append .yml
  if (!filePath.includes(".")) {
    filePath = `${filePath}.yml`;
  }

  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) {
    throw new ConfigParsingError(`Invalid filename "${filePath}".`);
  }

  // -----------------------------
  // Step 2: Validate (optional)
  // -----------------------------
  let finalConfig: any = config;

  if (schema) {
    finalConfig = schema.parse(config);
  }

  // Version is always required
  if (
    !finalConfig ||
    typeof finalConfig !== "object" ||
    typeof finalConfig.version !== "string"
  ) {
    throw new ConfigParsingError(
      "Config must contain a valid 'version' field before saving.",
    );
  }

  // -----------------------------
  // Step 3: Serialize based on extension
  // -----------------------------
  let serialized: string;

  switch (ext) {
    case "yml":
    case "yaml": {
      const yaml = await import("@std/yaml");
      serialized = yaml.stringify(finalConfig, { indent: 2 });
      break;
    }

    case "toml": {
      const toml = await import("@std/toml");
      serialized = toml.stringify(finalConfig);
      break;
    }

    case "json": {
      serialized = JSON.stringify(finalConfig);
      break;
    }

    case "jsonc": {
      serialized = JSON.stringify(finalConfig);
      break;
    }

    case "ini": {
      const ini = await import("@std/ini");
      serialized = ini.stringify(finalConfig);
      break;
    }

    case "xml": {
      const xml = await import("@libs/xml");
      serialized = xml.stringify({config:finalConfig});
      break;
    }

    default:
      throw new ConfigParsingError(
        `Unsupported extension ".${ext}". Supported formats: yml, yaml, json, jsonc, toml, ini, xml.`,
      );
  }

  // -----------------------------
  // Step 4: Write to disk
  // -----------------------------
  await writeFile(filePath, serialized, { encoding: "utf8" });
}