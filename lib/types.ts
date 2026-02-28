import type { ZodType } from "@zod/zod";

/**
 * Injectable logger interface
 */
export interface NConfigLogger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/**
 * Parse options
 *
 * @param filePath The file path to parse.
 * @param logger The logger to use, null to disable logging.
 * */
export interface ParseOptions {
  filePath?: string;
  logger?: NConfigLogger | null | undefined;
}

/**
 * Save options
 * 
 * @param filePath The file path to save to.
 * @param schema The Zod shape of the validated config file.
 * @param logger The logger to use, null to disable logging.
 */
export interface SaveOptions {
  filePath?: string;
  schema?: ZodType<any>;
  logger?: NConfigLogger | null | undefined;
}

/**
 * File writer interface
 * 
 * @param path The file path to save to.
 * @param data The string or Uint8Array you want to write.
 * @param options Optional file encoding, used for text files.
 */
export type WriteFileFn = (
  path: string | URL,
  data: string | Uint8Array,
  options?: { encoding?: string },
) => Promise<void>;