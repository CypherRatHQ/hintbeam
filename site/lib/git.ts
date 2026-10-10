import { execFileSync } from "node:child_process";
import { join } from "node:path";

const ROOT = join(process.cwd(), "..");

/**
 * The day a file last changed in git ("2026-10-08"), for sitemaps and structured data. Undefined
 * when git can't tell: outside a checkout, an uncommitted file, or a shallow clone, where every file
 * would wrongly share the latest commit's date. (The Pages build checks out full history.)
 */
export function lastModified(path: string): string | undefined {
  try {
    const shallow = execFileSync("git", ["rev-parse", "--is-shallow-repository"], { cwd: ROOT, encoding: "utf8" }).trim();
    if (shallow !== "false") return undefined;
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", path], { cwd: ROOT, encoding: "utf8" }).trim() || undefined;
  } catch {
    return undefined;
  }
}
