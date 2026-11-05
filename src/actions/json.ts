import { ActionDefinition } from "../types";
import { Icon } from "@vicinae/api";
import YAML from "yaml";

function formatJson(str: string): any {
  return JSON.parse(str);
}

function flattenObject(obj: any, prefix = ""): Record<string, any> {
  return Object.keys(obj).reduce((acc: any, k: string) => {
    const pre = prefix.length ? prefix + "." : "";
    if (
      typeof obj[k] === "object" &&
      obj[k] !== null &&
      !Array.isArray(obj[k])
    ) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

function jsonToTypeScriptInterface(obj: any, interfaceName = "Root"): string {
  function getType(val: any, indent: string): string {
    if (val === null) return "null";
    if (Array.isArray(val)) {
      if (val.length === 0) return "any[]";
      const itemTypes = Array.from(
        new Set(val.slice(0, 10).map((v) => getType(v, indent))),
      );
      return `(${itemTypes.join(" | ")})[]`;
    }
    if (typeof val === "object") {
      const lines = Object.entries(val).map(([k, v]) => {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)
          ? k
          : JSON.stringify(k);
        return `${indent}  ${safeKey}: ${getType(v, indent + "  ")};`;
      });
      return `{\n${lines.join("\n")}\n${indent}}`;
    }
    return typeof val;
  }

  return `export interface ${interfaceName} ${getType(obj, "")}\n`;
}

function jsonToZodSchema(obj: any, schemaName = "rootSchema"): string {
  function getZodType(val: any, indent: string): string {
    if (val === null) return "z.null()";
    if (Array.isArray(val)) {
      if (val.length === 0) return "z.array(z.any())";
      return `z.array(${getZodType(val[0], indent)})`;
    }
    if (typeof val === "object") {
      const lines = Object.entries(val).map(([k, v]) => {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)
          ? k
          : JSON.stringify(k);
        return `${indent}  ${safeKey}: ${getZodType(v, indent + "  ")},`;
      });
      return `z.object({\n${lines.join("\n")}\n${indent}})`;
    }
    if (typeof val === "number") return "z.number()";
    if (typeof val === "boolean") return "z.boolean()";
    if (typeof val === "string") return "z.string()";
    return "z.any()";
  }

  return `import { z } from "zod";\n\nexport const ${schemaName} = ${getZodType(obj, "")};\n\nexport type ${schemaName.replace(/Schema$/, "Type")} = z.infer<typeof ${schemaName}>;\n`;
}

export const jsonActions: ActionDefinition[] = [
  {
    name: "Convert JSON to TypeScript Interface",
    description:
      "Generate TypeScript interface definitions from JSON structure",
    icon: Icon.Code,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const obj = formatJson(clip);
        const tsCode = jsonToTypeScriptInterface(obj, "GeneratedType");
        await copyToClipboard(tsCode);
        await notify("TypeScript Interface Generated", "Copied to clipboard");
      } catch (e) {
        await notify("Invalid JSON", String(e));
      }
    },
  },
  {
    name: "Convert JSON to Zod Schema",
    description: "Generate Zod runtime validation schema from JSON structure",
    icon: Icon.Checkmark,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const obj = formatJson(clip);
        const zodCode = jsonToZodSchema(obj, "generatedSchema");
        await copyToClipboard(zodCode);
        await notify("Zod Schema Generated", "Copied to clipboard");
      } catch (e) {
        await notify("Invalid JSON", String(e));
      }
    },
  },
  {
    name: "Convert JSON to YAML (Pure TS)",
    description: "Convert JSON to clean YAML format in-memory",
    icon: Icon.BlankDocument,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const obj = formatJson(clip);
        const yamlStr = YAML.stringify(obj);
        await copyToClipboard(yamlStr);
        await notify("Converted to YAML", "Copied to clipboard");
      } catch (e) {
        await notify("Convert Error", String(e));
      }
    },
  },
  {
    name: "Pretty Print",
    description: "Format JSON with 2 spaces indentation",
    icon: Icon.Code,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const obj = formatJson(clip);
        const formatted = JSON.stringify(obj, null, 2);
        await copyToClipboard(formatted);
        await notify("JSON Formatted", "Copied to clipboard");
      } catch (e) {
        await notify("Invalid JSON", String(e));
      }
    },
  },
  {
    name: "Flatten JSON",
    description: "Flatten nested JSON object keys into dot notation",
    icon: Icon.CheckList,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const obj = formatJson(clip);
        const flat = flattenObject(obj);
        const result = JSON.stringify(flat, null, 2);
        await copyToClipboard(result);
        await notify("Flattened JSON", "JSON flattened successfully");
      } catch (e) {
        await notify("Invalid JSON", String(e));
      }
    },
  },
  {
    name: "Extract Values",
    description: "Extract list of all values from JSON object or array",
    icon: Icon.CheckList,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const obj = formatJson(clip);
        const values = Array.isArray(obj) ? obj : Object.values(obj);
        const result = JSON.stringify(values, null, 2);
        await copyToClipboard(result);
        await notify("Extracted Values", "Values copied to clipboard");
      } catch (e) {
        await notify("Invalid JSON", String(e));
      }
    },
  },
  {
    name: "Sort Keys",
    description: "Sort JSON keys alphabetically",
    icon: Icon.CheckList,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const obj = formatJson(clip);
        const sortObj = (o: any): any => {
          if (Array.isArray(o)) return o.map(sortObj);
          if (o !== null && typeof o === "object") {
            return Object.keys(o)
              .sort()
              .reduce((acc: any, key) => {
                acc[key] = sortObj(o[key]);
                return acc;
              }, {});
          }
          return o;
        };
        const sorted = JSON.stringify(sortObj(obj), null, 2);
        await copyToClipboard(sorted);
        await notify("JSON Keys Sorted", "Copied to clipboard");
      } catch (e) {
        await notify("Invalid JSON", String(e));
      }
    },
  },
  {
    name: "Filter Nulls",
    description: "Remove all null or undefined properties",
    icon: Icon.Trash,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const obj = formatJson(clip);
        const removeNulls = (o: any): any => {
          if (Array.isArray(o))
            return o.map(removeNulls).filter((v) => v !== null);
          if (o !== null && typeof o === "object") {
            return Object.entries(o)
              .filter(([_, v]) => v !== null && v !== undefined)
              .reduce((acc: any, [k, v]) => {
                acc[k] = removeNulls(v);
                return acc;
              }, {});
          }
          return o;
        };
        const cleaned = JSON.stringify(removeNulls(obj), null, 2);
        await copyToClipboard(cleaned);
        await notify("Nulls Filtered", "Copied to clipboard");
      } catch (e) {
        await notify("Invalid JSON", String(e));
      }
    },
  },
  {
    name: "Get Length",
    description: "Get count of array elements or object keys",
    icon: Icon.Info01,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { notify }) => {
      try {
        const obj = formatJson(clip);
        const len = Array.isArray(obj) ? obj.length : Object.keys(obj).length;
        await notify("JSON Length", `Count: ${len}`);
      } catch (e) {
        await notify("Invalid JSON", String(e));
      }
    },
  },
  {
    name: "Count Fields",
    description: "Count top-level keys in JSON object",
    icon: Icon.CheckList,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { notify }) => {
      try {
        const obj = formatJson(clip);
        const count = Object.keys(obj).length;
        await notify("JSON Fields", `${count} keys found`);
      } catch (e) {
        await notify("Invalid JSON", String(e));
      }
    },
  },
  {
    name: "Base64 Encode",
    description: "Encode JSON to base64 string",
    icon: Icon.Lock,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const b64 = Buffer.from(clip, "utf-8").toString("base64");
      await copyToClipboard(b64);
      await notify("Base64 Encoded", "Copied to clipboard");
    },
  },
  {
    name: "Base64 Decode",
    description: "Decode base64 into text/JSON",
    icon: Icon.LockUnlocked,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const text = Buffer.from(clip, "base64").toString("utf-8");
        await copyToClipboard(text);
        await notify("Base64 Decoded", "Copied to clipboard");
      } catch (e) {
        await notify("Decode Failed", String(e));
      }
    },
  },
  {
    name: "Escape String",
    description: "JSON escape string",
    icon: Icon.QuoteBlock,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      await copyToClipboard(JSON.stringify(clip));
      await notify("Escaped String", "Copied to clipboard");
    },
  },
  {
    name: "Unescape String",
    description: "Unescape JSON string",
    icon: Icon.QuoteBlock,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const unescaped = JSON.parse(clip);
        await copyToClipboard(String(unescaped));
        await notify("Unescaped String", "Copied to clipboard");
      } catch {
        await copyToClipboard(clip.replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
        await notify("Unescaped String", "Copied to clipboard");
      }
    },
  },
  {
    name: "View in Neovim",
    description: "Save JSON to /tmp/temp.json and open in Kitty + Neovim",
    icon: Icon.Terminal,
    category: { type: "code", lang: "json" },
    run: async ({ clip }, { saveFile, runShell }) => {
      let content = clip;
      try {
        content = JSON.stringify(JSON.parse(clip), null, 2);
      } catch {}
      await saveFile("/tmp/temp.json", content);
      await runShell("noevide /tmp/temp.json");
    },
  },
  {
    name: "Convert to TOML",
    description: "Convert JSON to TOML via yq",
    icon: Icon.BlankDocument,
    category: { type: "code", lang: "json" },
    binaries: ["yq"],
    run: async ({ clip }, { runShell, copyToClipboard, notify }) => {
      const { stdout } = await runShell(`echo '${clip}' | yq -p json -o toml`);
      await copyToClipboard(stdout);
      await notify("Converted to TOML", "Copied to clipboard");
    },
  },
  {
    name: "Convert to XML",
    description: "Convert JSON to XML via yq",
    icon: Icon.BlankDocument,
    category: { type: "code", lang: "json" },
    binaries: ["yq"],
    run: async ({ clip }, { runShell, copyToClipboard, notify }) => {
      const { stdout } = await runShell(`echo '${clip}' | yq -p json -o xml`);
      await copyToClipboard(stdout);
      await notify("Converted to XML", "Copied to clipboard");
    },
  },
];
