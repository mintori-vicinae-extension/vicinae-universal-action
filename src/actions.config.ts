import { ActionDefinition } from "./types";
import { jsonActions } from "./actions/json";
import { textActions } from "./actions/text";
import { pathActions } from "./actions/path";
import { urlActions } from "./actions/url";
import { colorActions } from "./actions/color";
import { imageActions } from "./actions/image";
import { fileSaveActions } from "./actions/file_save";
import { smartUtilityActions } from "./actions/smart_utils";

/**
 * All actions in pure TypeScript with AI Renamer + smart fallback + smart utilities.
 */
export const actions: ActionDefinition[] = [
  ...fileSaveActions,
  ...smartUtilityActions,
  ...jsonActions,
  ...textActions,
  ...pathActions,
  ...urlActions,
  ...colorActions,
  ...imageActions,
];
