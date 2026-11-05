import { ActionDefinition, ActionMatcherInput } from "../types";
import { hasBinary } from "./validate";

export async function isActionMatching(
  action: ActionDefinition,
  input: ActionMatcherInput
): Promise<boolean> {
  const { clip, category } = input;

  // 1. Check required binaries on host system
  if (action.binaries && action.binaries.length > 0) {
    const checks = await Promise.all(action.binaries.map((bin) => hasBinary(bin)));
    if (checks.some((available) => !available)) {
      return false;
    }
  }

  // 2. Check custom validator if present
  if (action.validator) {
    const valid = await action.validator(clip, category);
    if (!valid) {
      return false;
    }
  }

  // 3. Check category filter
  if (action.category === "all") {
    return true;
  }

  if (typeof action.category === "string") {
    return action.category === category.type;
  }

  if (action.category.type !== category.type) {
    return false;
  }

  if (action.category.type === "code" && category.type === "code") {
    const filterLang = action.category.lang;
    return !filterLang || filterLang === "all" || filterLang === category.lang;
  }

  if (action.category.type === "system" && category.type === "system") {
    const filterKind = action.category.kind;
    if (!filterKind) return true;
    if (filterKind === category.kind) return true;
    // Special rule: A youtube URL is also a valid general URL
    if (filterKind === "url" && category.kind === "youtube") return true;
    return false;
  }

  return true;
}
