import type { UwufufuClient } from "./client.js";
import type { Game, VideoSelection } from "./types.js";

/**
 * One row of the import JSON. Only `url` is required; `track_name`/`artist` are
 * passthrough metadata (uwufufu fetches the real title from the video itself).
 * `added_to_uwufufu` is used to skip rows that already succeeded (resume).
 */
export interface TrackEntry {
  track_name?: string;
  artist?: string;
  url: string;
  added_to_uwufufu?: boolean;
}

/** Progress events emitted by {@link importTracks}. */
export type ImportEvent =
  | { type: "game"; gameId: number; created: boolean; slug?: string }
  | { type: "skipped"; index: number; track: TrackEntry }
  | {
      type: "added";
      index: number;
      track: TrackEntry;
      selection: VideoSelection;
    }
  | { type: "error"; index: number; track: TrackEntry; error: unknown };

export interface ImportOptions {
  /** The tracks to import. Mutated in place: successful rows get `added_to_uwufufu = true`. */
  tracks: TrackEntry[];
  /** Append to this existing worldcup id. */
  gameId?: number;
  /** Or create a new worldcup (used when `gameId` is not given). */
  create?: {
    title: string;
    description: string;
    categoryId: number;
    isNsfw?: boolean;
  };
  /** Clip start in seconds for every selection (default 0). */
  startTime?: number;
  /** Clip end in seconds for every selection (default 0 = full video). */
  endTime?: number;
  /**
   * Called after each track is processed (added / skipped / errored). Awaited,
   * so a CLI can persist the file after every success.
   */
  onProgress?: (event: ImportEvent) => void | Promise<void>;
}

export interface ImportResult {
  gameId: number;
  /** Set when a new worldcup was created. */
  slug?: string;
  /** Whether the worldcup was created by this run. */
  created: boolean;
  added: number;
  skipped: number;
  failed: number;
  /** The (mutated) tracks, with `added_to_uwufufu` updated. */
  tracks: TrackEntry[];
}

/**
 * Import a list of YouTube tracks into a worldcup as video selections.
 *
 * - If `gameId` is given, selections are appended to that worldcup.
 * - Otherwise `create` is used to make a new draft worldcup first.
 * - Rows with `added_to_uwufufu === true` are skipped (resume-friendly).
 * - A failed row is left with `added_to_uwufufu` falsy so a re-run retries it.
 *
 * Does not publish — call `client.games.publish(result.gameId, …)` afterwards.
 */
export async function importTracks(
  client: UwufufuClient,
  options: ImportOptions,
): Promise<ImportResult> {
  const { tracks, startTime = 0, endTime = 0, onProgress } = options;

  let gameId: number;
  let slug: string | undefined;
  let created = false;

  if (options.gameId !== undefined) {
    gameId = options.gameId;
  } else if (options.create) {
    const game: Game = await client.games.create(options.create);
    gameId = game.id;
    slug = game.slug;
    created = true;
  } else {
    throw new Error("importTracks requires either `gameId` or `create`.");
  }

  await onProgress?.({ type: "game", gameId, created, slug });

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (let index = 0; index < tracks.length; index++) {
    const track = tracks[index]!;

    if (track.added_to_uwufufu === true) {
      skipped++;
      await onProgress?.({ type: "skipped", index, track });
      continue;
    }

    try {
      const selection = await client.selections.addVideo({
        worldcupId: gameId,
        url: track.url,
        startTime,
        endTime,
      });
      track.added_to_uwufufu = true;
      added++;
      await onProgress?.({ type: "added", index, track, selection });
    } catch (error) {
      failed++;
      await onProgress?.({ type: "error", index, track, error });
    }
  }

  return { gameId, slug, created, added, skipped, failed, tracks };
}
