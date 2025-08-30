/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as delete_recent_update from "../delete_recent_update.js";
import type * as draft_updates from "../draft_updates.js";
import type * as import_ from "../import.js";
import type * as reset_draft from "../reset_draft.js";
import type * as summaries from "../summaries.js";
import type * as users from "../users.js";
import type * as weekly_updates from "../weekly_updates.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  delete_recent_update: typeof delete_recent_update;
  draft_updates: typeof draft_updates;
  import: typeof import_;
  reset_draft: typeof reset_draft;
  summaries: typeof summaries;
  users: typeof users;
  weekly_updates: typeof weekly_updates;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
