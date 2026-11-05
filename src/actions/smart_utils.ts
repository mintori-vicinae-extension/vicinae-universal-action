import { ActionDefinition } from "../types";
import { Icon } from "@vicinae/api";
import cronstrue from "cronstrue";

function isValidJwt(token: string): boolean {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    return typeof payload === "object" && payload !== null;
  } catch {
    return false;
  }
}

function parseJwt(token: string): { header: any; payload: any } | null {
  try {
    const parts = token.trim().split(".");
    const header = JSON.parse(Buffer.from(parts[0], "base64").toString("utf-8"));
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
    return { header, payload };
  } catch {
    return null;
  }
}

function isCronExpression(str: string): boolean {
  const clean = str.trim();
  const parts = clean.split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return false;
  try {
    cronstrue.toString(clean);
    return true;
  } catch {
    return false;
  }
}

function isUnixTimestamp(str: string): number | null {
  const clean = str.trim();
  if (!/^\d{10}(\d{3})?$/.test(clean)) return null;
  const num = parseInt(clean, 10);
  // sensible date range between 2000 and 2100
  const ms = clean.length === 10 ? num * 1000 : num;
  if (ms > 946684800000 && ms < 4102444800000) {
    return ms;
  }
  return null;
}

export const smartUtilityActions: ActionDefinition[] = [
  // --- JWT Decoder ---
  {
    name: "Decode JWT Token",
    description: "Decode JWT token payload and inspect expiration date",
    icon: Icon.LockUnlocked,
    category: "plaintext",
    validator: (clip) => isValidJwt(clip),
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const parsed = parseJwt(clip);
      if (!parsed) {
        await notify("Invalid JWT", "Could not parse JWT token");
        return;
      }
      const exp = parsed.payload.exp ? new Date(parsed.payload.exp * 1000).toLocaleString() : "None";
      const formatted = JSON.stringify(parsed, null, 2);
      await copyToClipboard(formatted);
      await notify("JWT Decoded (Copied)", `Expires: ${exp}`);
    },
  },

  // --- Timestamp to Human Date ---
  {
    name: "Convert Timestamp to Date",
    description: "Convert Unix epoch timestamp to formatted local & UTC date",
    icon: Icon.Clock,
    category: "plaintext",
    validator: (clip) => isUnixTimestamp(clip) !== null,
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const ms = isUnixTimestamp(clip);
      if (!ms) return;
      const date = new Date(ms);
      const local = date.toLocaleString();
      const iso = date.toISOString();
      const res = `${local} (ISO: ${iso})`;
      await copyToClipboard(local);
      await notify("Date Converted", res);
    },
  },

  // --- Cron Expression Explainer ---
  {
    name: "Explain Cron Expression",
    description: "Translate cron syntax into plain English schedule description",
    icon: Icon.Calendar,
    category: "plaintext",
    validator: (clip) => isCronExpression(clip),
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const explanation = cronstrue.toString(clip.trim(), { verbose: true });
        await copyToClipboard(explanation);
        await notify("Cron Schedule", explanation);
      } catch (err) {
        await notify("Invalid Cron", String(err));
      }
    },
  },

  // --- Extract All URLs / Emails / IPs ---
  {
    name: "Extract All URLs",
    description: "Extract all web links from text into a line-by-line list",
    icon: Icon.Link,
    category: "all",
    validator: (clip) => (clip.match(/https?:\/\/[^\s"'<>]+/gi)?.length ?? 0) > 0,
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const matches = clip.match(/https?:\/\/[^\s"'<>]+/gi);
      if (matches && matches.length > 0) {
        const unique = Array.from(new Set(matches)).join("\n");
        await copyToClipboard(unique);
        await notify("Extracted URLs", `Found ${Array.from(new Set(matches)).length} URLs`);
      } else {
        await notify("No URLs Found", "No web links found in content");
      }
    },
  },
  {
    name: "Extract All Emails",
    description: "Extract all email addresses from text",
    icon: Icon.Envelope,
    category: "all",
    validator: (clip) => (clip.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi)?.length ?? 0) > 0,
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const matches = clip.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi);
      if (matches && matches.length > 0) {
        const unique = Array.from(new Set(matches)).join("\n");
        await copyToClipboard(unique);
        await notify("Extracted Emails", `Found ${Array.from(new Set(matches)).length} emails`);
      } else {
        await notify("No Emails Found", "No emails found in content");
      }
    },
  },
  {
    name: "Extract All IP Addresses",
    description: "Extract all IPv4 addresses from text or log data",
    icon: Icon.Globe01,
    category: "all",
    validator: (clip) => (clip.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)?.length ?? 0) > 0,
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const matches = clip.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
      if (matches && matches.length > 0) {
        const validIps = matches.filter((ip) => {
          const parts = ip.split(".").map(Number);
          return parts.every((p) => p >= 0 && p <= 255);
        });
        const unique = Array.from(new Set(validIps)).join("\n");
        await copyToClipboard(unique);
        await notify("Extracted IPs", `Found ${Array.from(new Set(validIps)).length} IP addresses`);
      } else {
        await notify("No IPs Found", "No IPv4 addresses found in content");
      }
    },
  },

  // --- Math & Expression Solver ---
  {
    name: "Calculate Math Expression",
    description: "Evaluate arithmetic expression or LaTeX formula directly",
    icon: Icon.Calculator,
    category: "plaintext",
    validator: (clip) => {
      const clean = clip.trim();
      return /^[0-9+\-*/%^().\s\^]+$/.test(clean) && /[+\-*/%]/.test(clean);
    },
    run: async ({ clip }, { copyToClipboard, notify }) => {
      try {
        const clean = clip.trim().replace(/\^/g, "**");
        // Safe evaluation limited to basic math operators
        const fn = new Function(`"use strict"; return (${clean});`);
        const result = fn();
        if (typeof result === "number" && !isNaN(result)) {
          const resStr = String(result);
          await copyToClipboard(resStr);
          await notify("Math Result", `${clip.trim()} = ${resStr}`);
        }
      } catch (err) {
        await notify("Math Error", String(err));
      }
    },
  },
];
