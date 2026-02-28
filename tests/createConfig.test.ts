import { createConfig } from "@lib";
import { z } from "@zod/zod";
import { join } from "@std/path";
import { expect } from "@std/expect";

const schema = z.object({
  version: z.string(),
  files: z.object({
    input: z.string(),
    output: z.string(),
  }),
});

const expectedConfig = {
  "config": {
    "version": "1.0",
    "files": {
      "input": "C:\\input",
      "output": "C:\\output",
    },
  },
  "wasMigrated": false,
};
const cfgPath = "tests\\configs";

Deno.test({
  name: "should read json format config",
  fn: async () => {
    const configJson = await createConfig(schema, {
      filePath: join(cfgPath, "config.json"),
    });
    expect(configJson).toEqual(expectedConfig);
  },
});
Deno.test({
  name: "should read jsonc format config",
  fn: async () => {
    const configJsonc = await createConfig(schema, {
      filePath: join(cfgPath, "config.jsonc"),
    });
    expect(configJsonc).toEqual(expectedConfig);
  },
});

Deno.test({
  name: "should read toml format config",
  fn: async () => {
    const configToml = await createConfig(schema, {
      filePath: join(cfgPath, "config.toml"),
    });
    expect(configToml).toEqual(expectedConfig);
  },
});

Deno.test({
  name: "should read ini format config",
  fn: async () => {
    const configIni = await createConfig(schema, {
      filePath: join(cfgPath, "config.ini"),
    });
    expect(configIni).toEqual(expectedConfig);
  },
});

Deno.test({
  name: "should read xml format config",
  fn: async () => {
    const configXml = await createConfig(schema, {
      filePath: join(cfgPath, "config.xml"),
    });
    expect(configXml).toEqual(expectedConfig);
  },
});

Deno.test({
  name: "should read yaml format config",
  fn: async () => {
    const configYaml = await createConfig(schema, {
      filePath: join(cfgPath, "config.yaml"),
    });
    expect(configYaml).toEqual(expectedConfig);
  },
});

Deno.test("should parse yaml at default location", async () => {
  const config = await createConfig(z.object({ location: z.string() }));
  expect(config).toEqual({
    config: { location: "config" },
    wasMigrated: false,
  });
});

Deno.test("should throw a 'bad path' error", async () => {
  await expect(
    createConfig(schema, {
      filePath: join(cfgPath, "bad-path.yml"),
    }),
  ).rejects.toThrow("The file provided does not exist.");
});

function migrate_1_0_to_1_1(old: any): any {
  return {
    version: "1.1",
    logging: {
      level: old.logLevel ?? "info",
    },
  };
}

Deno.test("should migrate 1.0 → 1.1", () => {
  const input = { version: "1.0", logLevel: "debug" };
  const output = migrate_1_0_to_1_1(input);
  expect(output.version).toEqual("1.1");
  expect(output.logging.level).toEqual("debug");
});
