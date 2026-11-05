import { Icon } from "@vicinae/api";

export type InputCategory =
  | { type: "code"; lang: string }
  | { type: "system"; kind: "url" | "path" | "youtube" }
  | { type: "color"; hex: string }
  | { type: "plaintext" }
  | { type: "image" };

export interface ActionContext {
  clip: string;
  category: InputCategory;
  extension: string;
}

export interface ActionMatcherInput {
  clip: string;
  category: InputCategory;
}

export interface ActionHelpers {
  runShell: (cmd: string) => Promise<{ stdout: string; stderr: string }>;
  saveFile: (targetPath: string, content: string | Buffer) => Promise<string>;
  copyToClipboard: (text: string) => Promise<void>;
  notify: (title: string, message?: string) => Promise<void>;
  resolvePath: (path: string) => string;
}

export type CategoryFilter =
  | "all"
  | "plaintext"
  | "image"
  | "color"
  | { type: "code"; lang?: "all" | string }
  | { type: "system"; kind?: "url" | "path" | "youtube" };

export interface ActionDefinition {
  id?: string;
  name: string;
  description?: string;
  icon?: Icon;
  category: CategoryFilter;
  /** Required binaries on host system (e.g. ['yt-dlp', 'kitty']) */
  binaries?: string[];
  /** Optional filter function returning true if the action matches (can be sync or async) */
  validator?: (clip: string, category: InputCategory) => boolean | Promise<boolean>;
  /** Execute handler with context and type-safe helpers */
  run: (ctx: ActionContext, helpers: ActionHelpers) => Promise<void> | void;
}
