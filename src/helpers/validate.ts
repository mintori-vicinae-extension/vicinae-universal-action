import { exec } from "child_process";

const binaryCache = new Map<string, boolean>();

/**
 * Check if a command or binary exists in PATH
 */
export function hasBinary(bin: string): Promise<boolean> {
  if (binaryCache.has(bin)) {
    return Promise.resolve(binaryCache.get(bin)!);
  }

  return new Promise((resolve) => {
    exec(`which ${bin} 2>/dev/null`, (err, stdout) => {
      const exists = !err && Boolean(stdout.trim());
      binaryCache.set(bin, exists);
      resolve(exists);
    });
  });
}

/**
 * Check if string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Check if URL points to common video platforms or direct video media streams
 */
export function isVideoUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  const lower = url.toLowerCase().trim();

  const videoDomains = [
    "youtube.com",
    "youtu.be",
    "tiktok.com",
    "vimeo.com",
    "facebook.com/watch",
    "fb.watch",
    "instagram.com/reel",
    "instagram.com/tv",
    "twitter.com",
    "x.com",
    "bilibili.com",
    "dailymotion.com",
    "twitch.tv",
    "reddit.com",
  ];

  if (videoDomains.some((d) => lower.includes(d))) {
    return true;
  }

  // Check direct video file extensions
  const videoExts = [".mp4", ".mkv", ".webm", ".mov", ".avi", ".flv", ".m4v", ".m3u8"];
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (videoExts.some((ext) => pathname.endsWith(ext))) {
      return true;
    }
  } catch {}

  return false;
}
