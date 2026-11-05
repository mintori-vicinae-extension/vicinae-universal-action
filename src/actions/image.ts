import { ActionDefinition } from "../types";
import { Icon } from "@vicinae/api";
import path from "path";
import os from "os";

export const imageActions: ActionDefinition[] = [
  {
    name: "OCR To Text",
    description: "Extract multi-language text (vie+eng+jpn...) from clipboard image directly",
    icon: Icon.BlankDocument,
    category: "image",
    binaries: ["wl-paste", "tesseract"],
    run: async (_, helpers) => {
      const tempImg = path.join(os.tmpdir(), "ocr_clipboard.png");
      try {
        await helpers.runShell(`wl-paste -t image/png > "${tempImg}"`);
        let lang = "vie+eng";
        try {
          const { stdout: osdOut } = await helpers.runShell(`tesseract "${tempImg}" - --psm 0 2>/dev/null`);
          const scriptMatch = osdOut.match(/Script:\s*(\w+)/);
          const script = scriptMatch ? scriptMatch[1] : "";
          switch (script) {
            case "Japanese": lang = "vie+eng+jpn+jpn_vert"; break;
            case "Han": lang = "vie+eng+chi_sim+chi_tra+jpn"; break;
            case "Cyrillic": lang = "vie+eng+rus"; break;
            case "Arabic": lang = "vie+eng+ara"; break;
          }
        } catch {}

        const { stdout: textResult } = await helpers.runShell(`tesseract "${tempImg}" - -l "${lang}" 2>/dev/null`);
        const trimmed = textResult.trim();
        if (trimmed) {
          await helpers.copyToClipboard(trimmed);
          await helpers.notify("OCR Success", trimmed.slice(0, 100));
        } else {
          await helpers.notify("OCR Failed", "No text detected in image.");
        }
      } catch (err) {
        await helpers.notify("OCR Error", String(err));
      } finally {
        await helpers.runShell(`rm -f "${tempImg}"`);
      }
    },
  },
  {
    name: "Get URL from QR Code",
    description: "Decode QR code in clipboard image to URL",
    icon: Icon.Eye,
    category: "image",
    binaries: ["wl-paste", "zbarimg"],
    run: async (_, { runShell, copyToClipboard, notify }) => {
      try {
        const { stdout } = await runShell("wl-paste -t image/png | zbarimg -q --raw -");
        const trimmed = stdout.trim();
        if (trimmed) {
          await copyToClipboard(trimmed);
          await notify("QR Code Decoded", trimmed);
        } else {
          await notify("QR Decode Failed", "No QR code detected");
        }
      } catch {
        await notify("QR Decode Failed", "No valid QR code found in image");
      }
    },
  },
  {
    name: "Save to Desktop",
    description: "Save clipboard image to ~/Desktop/img_TIMESTAMP.png",
    icon: Icon.Download,
    category: "image",
    binaries: ["wl-paste"],
    run: async (_, { runShell, notify }) => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const target = path.join(os.homedir(), "Desktop", `img_${ts}.png`);
      await runShell(`wl-paste > "${target}"`);
      await notify("Saved Image to Desktop", `img_${ts}.png`);
    },
  },
  {
    name: "Open with Gwenview",
    description: "View image in Gwenview image viewer",
    icon: Icon.Eye,
    category: "image",
    binaries: ["wl-paste", "gwenview"],
    run: async (_, { runShell }) => {
      await runShell(`wl-paste -t image/png > /tmp/tmp.png && [ -s /tmp/tmp.png ] && gwenview /tmp/tmp.png &`);
    },
  },
  {
    name: "Open with Pinta",
    description: "Edit image in Pinta image editor",
    icon: Icon.Brush,
    category: "image",
    binaries: ["wl-paste", "pinta"],
    run: async (_, { runShell }) => {
      await runShell(`wl-paste -t image/png > /tmp/tmp.png && [ -s /tmp/tmp.png ] && pinta /tmp/tmp.png &`);
    },
  },
  {
    name: "Compress Image (Caesium)",
    description: "Compress clipboard image using caesiumclt to Desktop",
    icon: Icon.Image,
    category: "image",
    binaries: ["wl-paste", "caesiumclt"],
    run: async (_, { runShell, notify }) => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const tempImg = path.join(os.tmpdir(), `caesium_input_${ts}.png`);
      const desktopDir = path.join(os.homedir(), "Desktop");
      const outputImg = path.join(desktopDir, `compressed_${ts}.png`);

      try {
        await runShell(`wl-paste -t image/png > "${tempImg}"`);
        await runShell(`caesiumclt -q 80 -o "${desktopDir}" "${tempImg}"`);
        const generatedOutput = path.join(desktopDir, `caesium_input_${ts}.png`);
        await runShell(`mv "${generatedOutput}" "${outputImg}"`);
        await notify("Image Compressed", `Saved as compressed_${ts}.png on Desktop`);
      } catch (err) {
        await notify("Compression Failed", String(err));
      } finally {
        await runShell(`rm -f "${tempImg}"`);
      }
    },
  },
];
