import { InputCategory } from "../types";

export function getFileExtension(category: InputCategory): string {
  switch (category.type) {
    case "code":
      switch (category.lang) {
        case "python":
          return "py";
        case "javascript":
          return "js";
        case "typescript":
          return "ts";
        case "rust":
          return "rs";
        case "html":
          return "html";
        case "css":
          return "css";
        case "json":
          return "json";
        case "markdown":
          return "md";
        case "shell":
        case "bash":
          return "sh";
        default:
          return category.lang || "txt";
      }
    case "plaintext":
      return "txt";
    case "image":
      return "png";
    case "color":
      return "css";
    case "system":
      return category.kind === "url" || category.kind === "youtube" ? "txt" : "path";
  }
}

function detectCodeLanguage(code: string): string | null {
  const trimmed = code.trim();
  // Markdown check: frontmatter --- or headers #
  if (trimmed.startsWith("---") || /^#+\s+.+/m.test(trimmed)) {
    return "markdown";
  }
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
      // ignore
    }
  }
  if (/\b(fn|pub fn|struct|impl|use std::|let mut)\b/.test(trimmed)) {
    return "rust";
  }
  if (/\b(def |import os|class .*:\n|elif )\b/.test(trimmed)) {
    return "python";
  }
  if (/\b(const |let |function |import .* from |export default)\b/.test(trimmed)) {
    return "typescript";
  }
  if (/\b(echo |grep |chmod |mkdir |rm -rf)\b/.test(trimmed)) {
    return "shell";
  }
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) {
    return "html";
  }
  return null;
}

function isHexColor(str: string): string | null {
  const clean = str.trim();
  if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(clean)) {
    return clean.startsWith("#") ? clean : `#${clean}`;
  }
  return null;
}

export async function classifyContent(text: string): Promise<InputCategory> {
  const trimmed = text.trim();

  // 1. Color detection (Hex)
  const hex = isHexColor(trimmed);
  if (hex) {
    return { type: "color", hex };
  }

  // 2. Local Path detection (~, $HOME, /, ./)
  // Only if single line and starts with path indicator
  if (
    !trimmed.includes("\n") &&
    (trimmed.startsWith("/") ||
      trimmed.startsWith("~") ||
      trimmed.startsWith("$HOME") ||
      trimmed.startsWith("./"))
  ) {
    return { type: "system", kind: "path" };
  }

  // 3. True single-line URL detection (NOT a big document that happens to contain a youtube link!)
  if (!trimmed.includes("\n")) {
    if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
      return { type: "system", kind: "youtube" };
    }
    if (/^https?:\/\/[^\s]+$/.test(trimmed)) {
      return { type: "system", kind: "url" };
    }
  }

  // 4. Code & Markdown heuristic
  const detectedLang = detectCodeLanguage(trimmed);
  if (detectedLang) {
    return { type: "code", lang: detectedLang };
  }

  return { type: "plaintext" };
}
