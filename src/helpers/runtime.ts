import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { Clipboard, showToast, Toast } from "@vicinae/api";
import { ActionHelpers } from "../types";

export function resolvePath(filePath: string): string {
  const home = os.homedir();
  if (filePath.startsWith("~")) {
    return path.join(home, filePath.slice(1));
  }
  if (filePath.startsWith("$HOME")) {
    return path.join(home, filePath.slice(5));
  }
  return path.resolve(filePath);
}

export const defaultHelpers: ActionHelpers = {
  resolvePath,

  runShell: (cmd: string): Promise<{ stdout: string; stderr: string }> => {
    return new Promise((resolve, reject) => {
      exec(cmd, { shell: "/bin/bash" }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  },

  saveFile: async (targetPath: string, content: string | Buffer): Promise<string> => {
    const resolved = resolvePath(targetPath);
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, content);
    return resolved;
  },

  copyToClipboard: async (text: string): Promise<void> => {
    await Clipboard.copy(text);
  },

  notify: async (title: string, message?: string): Promise<void> => {
    await showToast({
      style: Toast.Style.Success,
      title,
      message,
    });
  },
};
