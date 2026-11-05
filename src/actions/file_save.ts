import { ActionDefinition } from "../types";
import { Icon } from "@vicinae/api";
import path from "path";
import os from "os";
import fs from "fs/promises";

async function getUniqueDest(dir: string, filename: string): Promise<string> {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  let dest = path.join(dir, filename);
  let counter = 1;

  while (true) {
    try {
      await fs.stat(dest);
      dest = path.join(dir, `${base}-${counter}${ext}`);
      counter++;
    } catch {
      return dest;
    }
  }
}

async function getGeminiApiKey(): Promise<string> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  const secretsPath = path.join(os.homedir(), ".config/home-manager/secrets.json");
  try {
    const raw = await fs.readFile(secretsPath, "utf-8");
    const json = JSON.parse(raw);
    return json.GEMINI_API_KEY || json.GOOGLE_API_KEY || "";
  } catch {
    return "";
  }
}

/**
 * Ask Gemini API directly for a clean semantic filename (fast, reliable, no external CLI required)
 */
async function generateAiFilename(
  content: string,
  ext: string,
  isImage: boolean,
  apiKey: string
): Promise<string | null> {
  if (!apiKey) return null;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    let bodyContents: any[];

    if (isImage) {
      // Base64 image payload
      const base64Data = content; // passed as base64 string
      bodyContents = [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: base64Data,
              },
            },
            {
              text: "Analyze this image and suggest a concise, descriptive filename in kebab-case format. Do NOT include extension. Reply ONLY with the kebab-case name, nothing else.",
            },
          ],
        },
      ];
    } else {
      // Text snippet payload
      const snippet = content.slice(0, 2000);
      bodyContents = [
        {
          parts: [
            {
              text: `Analyze this content and suggest a concise, descriptive filename in kebab-case format (maximum 5 words). Do NOT include file extension. Reply ONLY with the kebab-case name, nothing else.\n\nContent:\n${snippet}`,
            },
          ],
        },
      ];
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: bodyContents }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const data: any = await response.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!candidate) return null;

    // Sanitize into strict kebab-case
    const cleanName = candidate
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    return cleanName ? `${cleanName}.${ext}` : null;
  } catch {
    return null;
  }
}

export const fileSaveActions: ActionDefinition[] = [
  {
    name: "Save and Rename with AI",
    description: "Save content or image to ~/Desktop using AI to generate a semantic filename (with fallback)",
    icon: Icon.Stars,
    category: "all",
    run: async ({ clip, category, extension }, { runShell, notify }) => {
      const desktopDir = path.join(os.homedir(), "Desktop");
      await fs.mkdir(desktopDir, { recursive: true });

      const isImage = category.type === "image";
      let ext = isImage ? "png" : extension || "txt";
      if (ext === "url" || ext === "path") {
        ext = "txt";
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const fallbackName = `${isImage ? "img" : "clip"}-${timestamp}.${ext}`;

      await notify("Analyzing with AI...", "Generating filename using Gemini");

      try {
        const apiKey = await getGeminiApiKey();

        let imageBase64 = "";
        if (isImage) {
          const { stdout } = await runShell("wl-paste -t image/png | base64 -w 0");
          imageBase64 = stdout.trim();
        }

        const aiFilename = await generateAiFilename(
          isImage ? imageBase64 : clip,
          ext,
          isImage,
          apiKey
        );

        const chosenName = aiFilename || fallbackName;
        const finalDest = await getUniqueDest(desktopDir, chosenName);

        if (isImage) {
          await runShell(`wl-paste -t image/png > "${finalDest}"`);
        } else {
          await fs.writeFile(finalDest, clip, "utf-8");
        }

        if (aiFilename) {
          await notify("Saved with AI Name", path.basename(finalDest));
        } else {
          await notify("Saved to Desktop (Fallback)", path.basename(finalDest));
        }
      } catch (err) {
        // Fallback error handling
        const finalDest = await getUniqueDest(desktopDir, fallbackName);
        try {
          if (isImage) {
            await runShell(`wl-paste -t image/png > "${finalDest}"`);
          } else {
            await fs.writeFile(finalDest, clip, "utf-8");
          }
          await notify("Saved to Desktop (Fallback)", path.basename(finalDest));
        } catch {
          await notify("Save Failed", String(err));
        }
      }
    },
  },
];
