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

/**
 * Check if URL is a GitHub blob or Gist URL that can be converted to raw format
 */
export function isGitHubConvertibleUrl(url: string): boolean {
  return toGitHubRawUrl(url) !== null;
}

/**
 * Convert GitHub blob or Gist URL to raw.githubusercontent.com or gist.githubusercontent.com
 */
export function toGitHubRawUrl(url: string): string | null {
  if (!isValidUrl(url)) return null;

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();

    // 1. github.com / www.github.com
    if (host === "github.com" || host === "www.github.com") {
      // Format: /:owner/:repo/blob/:branchOrCommit/:filePath...
      // Example: /ant-design/ant-design/blob/master/package.json
      const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+)$/);
      if (match) {
        const [, owner, repo, rest] = match;
        return `https://raw.githubusercontent.com/${owner}/${repo}/${rest}${parsed.search}`;
      }
    }

    // 2. gist.github.com
    if (host === "gist.github.com") {
      // Format: /:owner/:gistId or /:owner/:gistId/raw/...
      // Example: /user/123456789 -> https://gist.githubusercontent.com/user/123456789/raw
      const match = parsed.pathname.match(/^\/([^/]+)\/([a-f0-9]+)(?:\/raw(?:\/.*)?)?$/i);
      if (match) {
        const [, owner, gistId] = match;
        return `https://gist.githubusercontent.com/${owner}/${gistId}/raw${parsed.search}`;
      }
    }
  } catch {}

  return null;
}

