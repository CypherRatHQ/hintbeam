// Fallbacks for tools that ignore package.json "exports": TypeScript with `moduleResolution: "node"`
// and Metro before React Native 0.79. For each subpath export ("./next") this writes a folder with
// a package.json pointing at the built files, so `import … from "hintbeam/next"` resolves there too.
// Generated at build time from "exports", so the two never disagree; the folders are not in git.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

const pick = (target, condition) => {
  if (typeof target === "string") return target;
  if (target[condition]) return pick(target[condition], condition);
  return target.default ? pick(target.default, condition) : null;
};

const written = [];
for (const [subpath, target] of Object.entries(pkg.exports)) {
  if (subpath === "." || subpath.endsWith(".json")) continue;
  const name = subpath.slice(2);
  const dir = resolve(root, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const up = (file) => `../${file.replace(/^\.\//, "")}`;
  const stub = {
    name: `${pkg.name}/${name}`,
    private: true,
    sideEffects: false,
    main: up(pick(target, "default")),
    types: up(target.types ?? pick(target, "types")),
  };
  const native = target["react-native"] && pick(target["react-native"], "default");
  if (native) stub["react-native"] = up(native);
  writeFileSync(resolve(dir, "package.json"), `${JSON.stringify(stub, null, 2)}\n`);
  written.push(name);
}
console.log(`subpath fallbacks: ${written.join(", ")}`);
