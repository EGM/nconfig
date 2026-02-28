import { expect } from "@std/expect/expect";
import { assertSpyCalls, spy } from "@std/testing/mock";
import { saveConfig } from "../lib/saveConfig.ts";
import type { ZodType } from "@zod/zod";

Deno.test("should use default filename config.yml when no filePath provided", async () => {
  const writeSpy = spy(() => Promise.resolve());

  await saveConfig(
    { version: "1.0.0" },
    {},
    { writeFile: writeSpy },
  );

  assertSpyCalls(writeSpy, 1);
  expect(writeSpy.calls[0].args[0]).toBe("config.yml");
});

Deno.test("should append .yml extension when filename has no extension", async () => {
  const writeSpy = spy(() => Promise.resolve());

  await saveConfig(
    { version: "1.0.0" },
    { filePath: "config" },
    { writeFile: writeSpy },
  );

  assertSpyCalls(writeSpy, 1);

  const call = writeSpy.calls[0];
  expect(call.args[0]).toBe("config.yml");
  expect(typeof call.args[1]).toBe("string");
  expect(call.args[2]).toEqual(
    expect.objectContaining({ encoding: "utf8" }),
  );
});

Deno.test("should throw error when filename is invalid", async () => {
  await expect(
    saveConfig({ version: "1.0.0" }, { filePath: "." }),
  ).rejects.toThrow(`Invalid filename ".".`);
});

Deno.test("should throw error when config missing version field", async () => {
  await expect(
    saveConfig({ name: "test" }, { filePath: "config.json" }),
  ).rejects.toThrow("Config must contain a valid 'version' field");
});

Deno.test("should validate config with schema when provided", async () => {
  const parseSpy = spy((x) => x);

  const schema = { parse: parseSpy } as unknown as ZodType;

  await saveConfig(
    { version: "1.0.0" },
    { filePath: "config.json", schema },
  );

  assertSpyCalls(parseSpy, 1);
  expect(parseSpy.calls[0].args[0]).toEqual({ version: "1.0.0" });
});

Deno.test("should serialize to JSON format", async () => {
  const writeSpy = spy(() => Promise.resolve());

  await saveConfig(
    { version: "1.0.0", name: "test" },
    { filePath: "config.json" },
    { writeFile: writeSpy },
  );

  assertSpyCalls(writeSpy, 1);

  const call = writeSpy.calls[0];

  // correct filename
  expect(call.args[0]).toBe("config.json");

  // correct serialization
  expect(call.args[1]).toContain('"version"');
  expect(call.args[1]).toContain('"name"');

  // correct encoding
  expect(call.args[2]).toEqual(
    expect.objectContaining({ encoding: "utf8" }),
  );
});

Deno.test("should throw error for unsupported file extension", async () => {
  await expect(
    saveConfig({ version: "1.0.0" }, { filePath: "config.txt" }),
  ).rejects.toThrow("Unsupported extension");
});

Deno.test("should serialize to JSON format 2", async () => {
  const writeSpy = spy(() => Promise.resolve());

  await saveConfig(
    { version: "1.0.0", name: "test" },
    { filePath: "config.json" },
    { writeFile: writeSpy },
  );

  assertSpyCalls(writeSpy, 1);

  const call = writeSpy.calls[0];

  expect(call.args[0]).toBe("config.json");
  expect(call.args[1]).toContain(`"version":"1.0.0"`);
  expect(call.args[1]).toContain(`"name":"test"`);
  expect(call.args[2]).toEqual(
    expect.objectContaining({ encoding: "utf8" }),
  );
});

Deno.test("should serialize to YAML format", async () => {
  const writeSpy = spy(() => Promise.resolve());

  await saveConfig(
    { version: "1.0.0", name: "test" },
    { filePath: "config.yaml" },
    { writeFile: writeSpy },
  );

  assertSpyCalls(writeSpy, 1);

  const call = writeSpy.calls[0];

  expect(call.args[0]).toBe("config.yaml");
  expect(call.args[1]).toContain("version: 1.0.0");
  expect(call.args[1]).toContain("name: test");
  expect(call.args[2]).toEqual(
    expect.objectContaining({ encoding: "utf8" }),
  );
});

Deno.test("should serialize to TOML format", async () => {
  const writeSpy = spy(() => Promise.resolve());

  await saveConfig(
    { version: "1.0.0", name: "test" },
    { filePath: "config.toml" },
    { writeFile: writeSpy },
  );

  assertSpyCalls(writeSpy, 1);

  const call = writeSpy.calls[0];

  expect(call.args[0]).toBe("config.toml");
  expect(call.args[1]).toContain('version = "1.0.0"');
  expect(call.args[1]).toContain(`name = "test"`);
  expect(call.args[2]).toEqual(
    expect.objectContaining({ encoding: "utf8" }),
  );
});

Deno.test("should serialize to INI format", async () => {
  const writeSpy = spy(() => Promise.resolve());

  await saveConfig(
    { version: "1.0.0", name: "test" },
    { filePath: "config.ini" },
    { writeFile: writeSpy },
  );

  assertSpyCalls(writeSpy, 1);

  const call = writeSpy.calls[0];

  expect(call.args[0]).toBe("config.ini");
  expect(call.args[1]).toContain("version=1.0.0");
  expect(call.args[1]).toContain("name=test");
  expect(call.args[2]).toEqual(
    expect.objectContaining({ encoding: "utf8" }),
  );
});

Deno.test("should serialize to XML format", async () => {
  const writeSpy = spy(() => Promise.resolve());

  await saveConfig(
    { version: "1.0.0", name: "test" },
    { filePath: "config.xml" },
    { writeFile: writeSpy },
  );

  assertSpyCalls(writeSpy, 1);

  const call = writeSpy.calls[0];

  expect(call.args[0]).toBe("config.xml");
  expect(call.args[1]).toContain("<version>1.0.0</version>");
  expect(call.args[1]).toContain("<name>test</name>");
  expect(call.args[2]).toEqual(
    expect.objectContaining({ encoding: "utf8" }),
  );
});
