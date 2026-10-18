// Stands in for Deno "npm:" imports when edge-function code is unit-tested with Vitest.
export default class {}
export function createClient() {
  throw new Error("not available in tests");
}
