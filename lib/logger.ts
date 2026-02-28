import type { NConfigLogger } from "./types.ts";
export const defaultConsoleLogger: NConfigLogger = {
  info:    (m) => console.log(`\x1b[36m• ${m}\x1b[0m`),   // cyan bullet
  success: (m) => console.log(`\x1b[32m✓ ${m}\x1b[0m`),   // green check
  warn:    (m) => console.warn(`\x1b[33m! ${m}\x1b[0m`),  // yellow bang
  error:   (m) => console.error(`\x1b[31m✗ ${m}\x1b[0m`)  // red X
};
export function getLogger(logger:  NConfigLogger | null | undefined): NConfigLogger | null {
  return logger === undefined ? defaultConsoleLogger : logger;
}