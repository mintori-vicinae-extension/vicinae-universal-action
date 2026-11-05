import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

export interface ClipboardData {
  text: string;
  isImage: boolean;
  imageTempPath?: string;
}

export function checkClipboardImage(): Promise<boolean> {
  return new Promise((resolve) => {
    exec("wl-paste --list-types", (error, stdout) => {
      if (error || !stdout) {
        return resolve(false);
      }
      const hasImage = stdout.split("\n").some((t) => t.trim().startsWith("image/"));
      resolve(hasImage);
    });
  });
}

export function dumpClipboardImageToTemp(): Promise<string | null> {
  const tmpPath = path.join(os.tmpdir(), "vicinae_clip_preview.png");
  return new Promise((resolve) => {
    exec(`wl-paste -t image/png > "${tmpPath}"`, (error) => {
      if (error) {
        resolve(null);
      } else {
        resolve(tmpPath);
      }
    });
  });
}
