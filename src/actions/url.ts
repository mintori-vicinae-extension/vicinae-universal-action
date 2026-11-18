import { ActionDefinition } from "../types";
import { Icon } from "@vicinae/api";
import { isValidUrl, isVideoUrl, isGitHubConvertibleUrl, toGitHubRawUrl } from "../helpers/validate";

export const urlActions: ActionDefinition[] = [
  {
    name: "Download with yt-dlp",
    description: "Download video or audio using yt-dlp in Kitty terminal",
    icon: Icon.Download,
    category: { type: "system", kind: "url" },
    binaries: ["yt-dlp", "kitty"],
    validator: (clip) => isVideoUrl(clip),
    run: async ({ clip }, { runShell, notify }) => {
      await notify("Starting yt-dlp", clip.trim());
      await runShell(`kitty -- zsh -c "yt-dlp '${clip.trim()}'"`);
    },
  },
  {
    name: "Open with MPV",
    description: "Stream video directly in MPV player",
    icon: Icon.Video,
    category: { type: "system", kind: "url" },
    binaries: ["mpv"],
    validator: (clip) => isVideoUrl(clip),
    run: async ({ clip }, { runShell }) => {
      await runShell(`mpv '${clip.trim()}'`);
    },
  },
  {
    name: "Open in Browser",
    description: "Open URL in default web browser",
    icon: Icon.Globe01,
    category: { type: "system", kind: "url" },
    validator: (clip) => isValidUrl(clip),
    run: async ({ clip }, { runShell }) => {
      await runShell(`xdg-open '${clip.trim()}'`);
    },
  },
  {
    name: "Open Browser Incognito",
    description: "Open URL in Chrome Incognito mode",
    icon: Icon.EyeDisabled,
    category: { type: "system", kind: "url" },
    binaries: ["google-chrome"],
    validator: (clip) => isValidUrl(clip),
    run: async ({ clip }, { runShell }) => {
      await runShell(`google-chrome --incognito '${clip.trim()}'`);
    },
  },
  {
    name: "Copy GitHub Raw URL",
    description: "Convert GitHub blob/gist link to raw GitHub usercontent URL",
    icon: Icon.Link,
    category: { type: "system", kind: "url" },
    validator: (clip) => isGitHubConvertibleUrl(clip),
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const rawUrl = toGitHubRawUrl(clip);
      if (rawUrl) {
        await copyToClipboard(rawUrl);
        await notify("GitHub Raw URL Copied", rawUrl);
      } else {
        await notify("Convert Failed", "Could not convert to GitHub Raw URL");
      }
    },
  },
  {
    name: "Create Shorten URL",
    description: "Shorten URL via is.gd API service",
    icon: Icon.Link,
    category: { type: "system", kind: "url" },
    validator: (clip) => isValidUrl(clip),
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const res = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(clip.trim())}`);
        const shortened = await res.text();
        if (shortened.startsWith("https://is.gd/")) {
          await copyToClipboard(shortened);
          await notify("URL Shortened", shortened);
        } else {
          await notify("Shorten Failed", shortened);
        }
      } catch (err) {
        await notify("Shorten Failed", String(err));
      }
    },
  },
  {
    name: "Generate QR Code",
    description: "Generate QR code image and display in default viewer",
    icon: Icon.Eye,
    category: { type: "system", kind: "url" },
    binaries: ["qrencode"],
    validator: (clip) => isValidUrl(clip),
    run: async ({ clip }, { runShell, notify }) => {
      await runShell(`qrencode -s 10 -o /tmp/qr.png '${clip.trim()}' && wl-copy < /tmp/qr.png && xdg-open /tmp/qr.png`);
      await notify("QR Code Generated", "QR code image generated");
    },
  },
  {
    name: "URL Encode",
    description: "Encode special characters in URL",
    icon: Icon.Code,
    category: { type: "system", kind: "url" },
    validator: (clip) => isValidUrl(clip),
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const encoded = encodeURIComponent(clip.trim());
      await copyToClipboard(encoded);
      await notify("URL Encoded", encoded);
    },
  },
  {
    name: "URL Decode",
    description: "Decode %xx encoded characters in URL",
    icon: Icon.Code,
    category: { type: "system", kind: "url" },
    validator: (clip) => clip.includes("%"),
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const decoded = decodeURIComponent(clip.trim());
        await copyToClipboard(decoded);
        await notify("URL Decoded", decoded);
      } catch (e) {
        await notify("Decode Failed", String(e));
      }
    },
  },
];
