/**
 * How an export is retired (docs/versioning.md): it keeps working for at least one minor release,
 * is marked `@deprecated` in its types, and says once, in development, what to use instead.
 */

const isDev = typeof process !== "undefined" ? process.env?.["NODE_ENV"] !== "production" : true;
const warned = new Set<string>();

/** Warn once per name, in development only. `since` is the version that deprecated it. */
export function deprecated(name: string, replacement: string, since: string): void {
  if (!isDev || warned.has(name)) return;
  warned.add(name);
  console.warn(`hintbeam: ${name} is deprecated since ${since} and will be removed in the next major release. Use ${replacement} instead.`);
}
