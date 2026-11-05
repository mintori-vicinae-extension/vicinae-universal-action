import { ActionDefinition } from "../types";
import { Icon } from "@vicinae/api";
import crypto from "crypto";
import os from "os";
import fs from "fs/promises";
import path from "path";

export const textActions: ActionDefinition[] = [
  // --- Edit in Neovim (for text or code clipboard) ---
  {
    name: "Edit Clipboard in Neovim",
    description:
      "Save clipboard to a temporary file and edit in Kitty + Neovim",
    icon: Icon.Terminal,
    category: "all",
    binaries: ["neovide"],
    run: async ({ clip, extension }, { runShell }) => {
      const ext = extension || "txt";
      const tmpFile = path.join(os.tmpdir(), `clip_edit_${Date.now()}.${ext}`);
      await fs.writeFile(tmpFile, clip, "utf-8");
      // Open Kitty with Neovim, format on open if available, then auto-sync changes back to clipboard on exit
      await runShell(
        `kitty -- zsh -c "nvim '${tmpFile}'; wl-copy < '${tmpFile}'; rm -f '${tmpFile}'"`,
      );
    },
  },

  // --- Pure text transformations ---
  {
    name: "To One Line",
    description: "Remove all newlines and join as a single line",
    icon: Icon.Text,
    category: "plaintext",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const oneLine = clip.replace(/[\r\n]+/g, " ").trim();
      await copyToClipboard(oneLine);
      await notify("Single Line Copied", "Newlines removed");
    },
  },
  {
    name: "Uppercase",
    description: "Convert text to UPPERCASE",
    icon: Icon.Text,
    category: "plaintext",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      await copyToClipboard(clip.toUpperCase());
      await notify("Uppercase Copied", "Text converted to uppercase");
    },
  },
  {
    name: "Lowercase",
    description: "Convert text to lowercase",
    icon: Icon.Text,
    category: "plaintext",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      await copyToClipboard(clip.toLowerCase());
      await notify("Lowercase Copied", "Text converted to lowercase");
    },
  },
  {
    name: "To CamelCase",
    description: "Convert words to camelCase",
    icon: Icon.Text,
    category: "plaintext",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const camel = clip
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
        .replace(/^([A-Z])/, (_, chr) => chr.toLowerCase());
      await copyToClipboard(camel);
      await notify("CamelCase Copied", camel);
    },
  },
  {
    name: "To SnakeCase",
    description: "Convert words to snake_case",
    icon: Icon.Text,
    category: "plaintext",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const snake = clip
        .trim()
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((string) => string.toLowerCase())
        .join("_");
      await copyToClipboard(snake);
      await notify("SnakeCase Copied", snake);
    },
  },
  {
    name: "To KebabCase",
    description: "Convert words to kebab-case",
    icon: Icon.Text,
    category: "plaintext",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const kebab = clip
        .trim()
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((string) => string.toLowerCase())
        .join("-");
      await copyToClipboard(kebab);
      await notify("KebabCase Copied", kebab);
    },
  },
  {
    name: "Remove Whitespace",
    description: "Strip all whitespace from text",
    icon: Icon.Trash,
    category: "plaintext",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const clean = clip.replace(/\s+/g, "");
      await copyToClipboard(clean);
      await notify("Whitespace Removed", "Copied to clipboard");
    },
  },
  {
    name: "Reverse Text",
    description: "Reverse all characters in text",
    icon: Icon.ArrowClockwise,
    category: "plaintext",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const reversed = clip.split("").reverse().join("");
      await copyToClipboard(reversed);
      await notify("Reversed Text", "Copied to clipboard");
    },
  },
  {
    name: "Word & Character Count",
    description: "Count words, characters, and lines",
    icon: Icon.Info01,
    category: "plaintext",
    run: async ({ clip }, { notify }) => {
      const words = clip.trim() ? clip.trim().split(/\s+/).length : 0;
      const chars = clip.length;
      const lines = clip.split(/\r?\n/).length;
      await notify(
        "Statistics",
        `${words} words | ${chars} chars | ${lines} lines`,
      );
    },
  },
  {
    name: "Search Google",
    description: "Open query in Google search",
    icon: Icon.MagnifyingGlass,
    category: "plaintext",
    run: async ({ clip }, { runShell }) => {
      const encoded = encodeURIComponent(clip.trim());
      await runShell(`xdg-open 'https://www.google.com/search?q=${encoded}'`);
    },
  },
  {
    name: "Search YouTube",
    description: "Search query on YouTube",
    icon: Icon.Video,
    category: "plaintext",
    run: async ({ clip }, { runShell }) => {
      const encoded = encodeURIComponent(clip.trim());
      await runShell(
        `xdg-open 'https://www.youtube.com/results?search_query=${encoded}'`,
      );
    },
  },
  {
    name: "Search Shopee",
    description: "Search item on Shopee VN",
    icon: Icon.Cart,
    category: "plaintext",
    run: async ({ clip }, { runShell }) => {
      const encoded = encodeURIComponent(clip.trim());
      await runShell(`xdg-open 'https://shopee.vn/search?keyword=${encoded}'`);
    },
  },

  // --- Code & Multi-line specific actions ---
  {
    name: "To Markdown Table",
    description:
      "Convert tab or multi-space separated text into a Markdown table",
    icon: Icon.CheckList,
    category: { type: "code", lang: "all" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const lines = clip.trim().split(/\r?\n/);
      if (lines.length === 0) return;

      const formattedRows = lines.map((line, index) => {
        const cells = line.split(/\t| {2,}/).map((c) => c.trim());
        const row = `| ${cells.join(" | ")} |`;
        if (index === 0) {
          const separator = `| ${cells.map(() => "---").join(" | ")} |`;
          return `${row}\n${separator}`;
        }
        return row;
      });

      const table = formattedRows.join("\n");
      await copyToClipboard(table);
      await notify(
        "Markdown Table Copied",
        "Markdown table copied to clipboard",
      );
    },
  },
  {
    name: "Calculate SHA256",
    description: "Generate SHA256 hash digest from content",
    icon: Icon.Lock,
    category: { type: "code", lang: "all" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const hash = crypto.createHash("sha256").update(clip).digest("hex");
      await copyToClipboard(hash);
      await notify("SHA256 Copied", hash);
    },
  },
  {
    name: "Calculate MD5",
    description: "Generate MD5 hash digest from content",
    icon: Icon.Lock,
    category: { type: "code", lang: "all" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const hash = crypto.createHash("md5").update(clip).digest("hex");
      await copyToClipboard(hash);
      await notify("MD5 Copied", hash);
    },
  },
  {
    name: "Count Lines",
    description: "Count total number of lines in text or code",
    icon: Icon.Info01,
    category: { type: "code", lang: "all" },
    run: async ({ clip }, { notify }) => {
      const lines = clip.split(/\r?\n/).length;
      await notify("Total Lines", `${lines} lines`);
    },
  },
  {
    name: "Reverse Lines",
    description: "Reverse lines order (top to bottom inverted)",
    icon: Icon.ArrowClockwise,
    category: { type: "code", lang: "all" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const reversed = clip.split(/\r?\n/).reverse().join("\n");
      await copyToClipboard(reversed);
      await notify("Lines Reversed", "Copied to clipboard");
    },
  },
  {
    name: "Dedup Lines",
    description: "Deduplicate lines while preserving initial order",
    icon: Icon.Filter,
    category: { type: "code", lang: "all" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const lines = clip.split(/\r?\n/);
      const unique = Array.from(new Set(lines)).join("\n");
      await copyToClipboard(unique);
      await notify(
        "Lines Deduplicated",
        `${Array.from(new Set(lines)).length} lines remaining`,
      );
    },
  },
  {
    name: "Remove Comments",
    description: "Strip // single line or /* */ multi line code comments",
    icon: Icon.Trash,
    category: { type: "code", lang: "all" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const clean = clip
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*/g, "$1")
        .trim();
      await copyToClipboard(clean);
      await notify("Comments Removed", "Copied clean code");
    },
  },
  {
    name: "Open in Carbon",
    description: "Create beautiful code snippet image on Carbon.now.sh",
    icon: Icon.Globe01,
    category: { type: "code", lang: "all" },
    run: async ({ clip }, { runShell }) => {
      const encoded = encodeURIComponent(clip);
      await runShell(`xdg-open 'https://carbon.now.sh/?code=${encoded}'`);
    },
  },

  // --- HTML specific ---
  {
    name: "HTML to Text",
    description: "Strip HTML tags and unescape text entities",
    icon: Icon.BlankDocument,
    category: { type: "code", lang: "html" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const plain = clip
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s{2,}/g, " ")
        .trim();
      await copyToClipboard(plain);
      await notify("HTML to Plaintext", "Extracted plain text");
    },
  },

  // --- General All-Text ---
  {
    name: "Save to Notes",
    description: "Append clipboard content to ~/Desktop/notes.md",
    icon: Icon.SaveDocument,
    category: "all",
    run: async ({ clip }, { notify }) => {
      const notesPath = path.join(os.homedir(), "Desktop", "notes.md");
      const timestamp = new Date().toLocaleString();
      const entry = `\n\n---\n*Recorded at: ${timestamp}*\n\n${clip}\n`;
      await fs.appendFile(notesPath, entry, "utf-8");
      await notify("Saved to Notes", "~/Desktop/notes.md");
    },
  },
];
