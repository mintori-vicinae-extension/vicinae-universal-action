import { ActionDefinition } from "../types";
import { Icon } from "@vicinae/api";
import path from "path";
import os from "os";
import fs from "fs/promises";

async function isExistingPath(
  p: string,
  resolveFn: (x: string) => string,
): Promise<boolean> {
  try {
    const full = resolveFn(p.trim());
    await fs.stat(full);
    return true;
  } catch {
    return false;
  }
}

export const pathActions: ActionDefinition[] = [
  {
    name: "Edit in Neovim",
    description: "Open file or folder in Kitty terminal with Neovim",
    icon: Icon.Terminal,
    category: { type: "system", kind: "path" },
    binaries: ["neovide"],
    validator: (clip) => isExistingPath(clip, (p) => p),
    run: async ({ clip }, { resolvePath, runShell }) => {
      const fullPath = resolvePath(clip.trim());
      await runShell(`kitty -- zsh -c "nvim \\"${fullPath}\\""`);
    },
  },
  {
    name: "To Homedir (~ / $HOME)",
    description: "Convert path between absolute and relative ~ or $HOME",
    icon: Icon.House,
    category: { type: "system", kind: "path" },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const home = os.homedir();
      let res = clip.trim();
      if (res.startsWith(home)) {
        res = `~${res.slice(home.length)}`;
      } else if (res.startsWith("~")) {
        res = `${home}${res.slice(1)}`;
      }
      await copyToClipboard(res);
      await notify("Path Converted", res);
    },
  },
  {
    name: "Reveal in FileManager",
    description: "Open parent folder in system file manager",
    icon: Icon.Folder,
    category: { type: "system", kind: "path" },
    validator: (clip) => isExistingPath(clip, (p) => p),
    run: async ({ clip }, { resolvePath, runShell }) => {
      const fullPath = resolvePath(clip.trim());
      const parentDir = path.dirname(fullPath);
      await runShell(`xdg-open "${parentDir}"`);
    },
  },
  {
    name: "Open with Default App",
    description: "Open file or folder with default system application",
    icon: Icon.ArrowNe,
    category: { type: "system", kind: "path" },
    validator: (clip) => isExistingPath(clip, (p) => p),
    run: async ({ clip }, { resolvePath, runShell }) => {
      const fullPath = resolvePath(clip.trim());
      await runShell(`xdg-open "${fullPath}"`);
    },
  },
  {
    name: "Copy File Content",
    description: "Read file content and copy to clipboard",
    icon: Icon.CopyClipboard,
    category: { type: "system", kind: "path" },
    validator: async (clip) => {
      try {
        const stat = await fs.stat(clip.trim());
        return stat.isFile();
      } catch {
        return false;
      }
    },
    run: async ({ clip }, { resolvePath, copyToClipboard, notify }) => {
      try {
        const fullPath = resolvePath(clip.trim());
        const content = await fs.readFile(fullPath, "utf-8");
        await copyToClipboard(content);
        await notify(
          "File Content Copied",
          `Copied ${content.length} characters`,
        );
      } catch (e) {
        await notify("Read Failed", String(e));
      }
    },
  },
  {
    name: "Make Executable",
    description: "Add executable permission (chmod +x) to target file",
    icon: Icon.Checkmark,
    category: { type: "system", kind: "path" },
    validator: (clip) => isExistingPath(clip, (p) => p),
    run: async ({ clip }, { resolvePath, runShell, notify }) => {
      const fullPath = resolvePath(clip.trim());
      await runShell(`chmod +x "${fullPath}"`);
      await notify(
        "Permissions Updated",
        `chmod +x on ${path.basename(fullPath)}`,
      );
    },
  },
  {
    name: "Edit in VSCode",
    description: "Open file or directory in VSCode",
    icon: Icon.Code,
    category: { type: "system", kind: "path" },
    binaries: ["code"],
    validator: (clip) => isExistingPath(clip, (p) => p),
    run: async ({ clip }, { resolvePath, runShell }) => {
      const fullPath = resolvePath(clip.trim());
      await runShell(`code "${fullPath}"`);
    },
  },
  {
    name: "Edit in Zed",
    description: "Open file or directory in Zed",
    icon: Icon.Code,
    category: { type: "system", kind: "path" },
    binaries: ["zeditor"],
    validator: (clip) => isExistingPath(clip, (p) => p),
    run: async ({ clip }, { resolvePath, runShell }) => {
      const fullPath = resolvePath(clip.trim());
      await runShell(`zeditor "${fullPath}"`);
    },
  },
  {
    name: "Zip File",
    description: "Compress file into .zip archive",
    icon: Icon.Folder,
    category: { type: "system", kind: "path" },
    binaries: ["zip"],
    validator: (clip) => isExistingPath(clip, (p) => p),
    run: async ({ clip }, { resolvePath, runShell, notify }) => {
      const fullPath = resolvePath(clip.trim());
      await runShell(`zip "${fullPath}.zip" "${fullPath}"`);
      await notify("File Zipped", `Created ${path.basename(fullPath)}.zip`);
    },
  },
  {
    name: "Compress Image (Caesium)",
    description: "Compress image file using caesiumclt",
    icon: Icon.Image,
    category: { type: "system", kind: "path" },
    binaries: ["caesiumclt"],
    validator: async (clip) => {
      const fullPath = clip.trim();
      const ext = path.extname(fullPath).toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".webp", ".tiff"].includes(ext)) {
        return false;
      }
      return isExistingPath(clip, (p) => p);
    },
    run: async ({ clip }, { resolvePath, runShell, notify }) => {
      try {
        const fullPath = resolvePath(clip.trim());
        const dir = path.dirname(fullPath);
        await runShell(
          `caesiumclt -q 80 --suffix _compressed --same-folder-as-input "${fullPath}"`,
        );
        const ext = path.extname(fullPath);
        const base = path.basename(fullPath, ext);
        await notify("Image Compressed", `Created ${base}_compressed${ext}`);
      } catch (err) {
        await notify("Compression Failed", String(err));
      }
    },
  },
];
