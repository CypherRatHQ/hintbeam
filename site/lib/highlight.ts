import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerAliases(["ts", "tsx", "jsx", "js", "javascript"], { languageName: "typescript" });
hljs.registerAliases(["shell", "sh"], { languageName: "bash" });

/** Syntax-highlighted HTML for a code sample: the same on the server (docs, blog) and the client. */
export function highlight(code: string, language: string): string {
  const lang = hljs.getLanguage(language) ? language : "typescript";
  return hljs.highlight(code, { language: lang }).value;
}
