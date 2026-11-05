import { ActionDefinition } from "../types";
import { Icon } from "@vicinae/api";

function parseHex(hexStr: string): { r: number; g: number; b: number } | null {
  const clean = hexStr.trim().replace(/^#/, "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToRgb(h: number, s: number, l: number) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("")}`;
}

export const colorActions: ActionDefinition[] = [
  {
    name: "Copy Hex",
    description: "Copy raw Hex color",
    icon: Icon.EyeDropper,
    category: "color",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const hex = clip.trim().startsWith("#") ? clip.trim() : `#${clip.trim()}`;
      await copyToClipboard(hex);
      await notify("Color Hex Copied", hex);
    },
  },
  {
    name: "To RGB",
    description: "Convert hex color to rgb(r, g, b)",
    icon: Icon.EyeDropper,
    category: "color",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const rgb = parseHex(clip);
      if (rgb) {
        const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        await copyToClipboard(rgbStr);
        await notify("RGB Copied", rgbStr);
      }
    },
  },
  {
    name: "To HSL",
    description: "Convert hex color to hsl(h, s%, l%)",
    icon: Icon.EyeDropper,
    category: "color",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const rgb = parseHex(clip);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        await copyToClipboard(hslStr);
        await notify("HSL Copied", hslStr);
      }
    },
  },
  {
    name: "Darken Color (-20%)",
    description: "Darken color lightness by 20%",
    icon: Icon.EyeDropper,
    category: "color",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const rgb = parseHex(clip);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const newRgb = hslToRgb(hsl.h, hsl.s, Math.max(0, hsl.l - 20));
        const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        await copyToClipboard(hex);
        await notify("Darkened Color", hex);
      }
    },
  },
  {
    name: "Lighten Color (+20%)",
    description: "Lighten color lightness by 20%",
    icon: Icon.EyeDropper,
    category: "color",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const rgb = parseHex(clip);
      if (rgb) {
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const newRgb = hslToRgb(hsl.h, hsl.s, Math.min(100, hsl.l + 20));
        const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
        await copyToClipboard(hex);
        await notify("Lightened Color", hex);
      }
    },
  },
  {
    name: "Grayscale Color",
    description: "Convert color to grayscale luminosity",
    icon: Icon.EyeDropper,
    category: "color",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const rgb = parseHex(clip);
      if (rgb) {
        const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
        const hex = rgbToHex(gray, gray, gray);
        await copyToClipboard(hex);
        await notify("Grayscale Color", hex);
      }
    },
  },
  {
    name: "Invert Color",
    description: "Invert RGB channels",
    icon: Icon.EyeDropper,
    category: "color",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const rgb = parseHex(clip);
      if (rgb) {
        const invHex = rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
        await copyToClipboard(invHex);
        await notify("Inverted Color Copied", invHex);
      }
    },
  },
  {
    name: "To CSS Var",
    description: "Format as CSS variable declaration",
    icon: Icon.Code,
    category: "color",
    run: async ({ clip }, { copyToClipboard, notify }) => {
      const hex = clip.trim().startsWith("#") ? clip.trim() : `#${clip.trim()}`;
      const css = `--color: ${hex};`;
      await copyToClipboard(css);
      await notify("CSS Var Copied", css);
    },
  },
  {
    name: "Color-Hex.com",
    description: "Open color in color-hex.com database",
    icon: Icon.Globe01,
    category: "color",
    run: async ({ clip }, { runShell }) => {
      const clean = clip.trim().replace(/^#/, "");
      await runShell(`xdg-open 'https://www.color-hex.com/color/${clean}'`);
    },
  },
];
