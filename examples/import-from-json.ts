/**
 * Import YouTube tracks from a JSON file into a uwufufu worldcup.
 *
 * Input file: an array of objects shaped like
 *   { "track_name": "...", "artist": "...", "url": "https://youtu.be/...", "added_to_uwufufu": false }
 * Only `url` is required. The `added_to_uwufufu` flag is written back to the
 * same file after each success, so re-running resumes where it left off.
 *
 * Usage:
 *   # Auth: a token, or email + password
 *   export UWUFUFU_TOKEN=...                # or UWUFUFU_EMAIL + UWUFUFU_PASSWORD
 *
 *   # Target: append to an existing worldcup...
 *   UWUFUFU_GAME_ID=159215 npx tsx examples/import-from-json.ts tracks.json
 *
 *   # ...or create a new one
 *   UWUFUFU_TITLE="Song Battle" UWUFUFU_CATEGORY_ID=16 \
 *     npx tsx examples/import-from-json.ts tracks.json
 *
 * Optional: UWUFUFU_DESCRIPTION, UWUFUFU_NSFW=true,
 *           UWUFUFU_START (sec), UWUFUFU_END (sec).
 */
import { readFile, writeFile } from "node:fs/promises";
import { createClient, importTracks, type TrackEntry } from "../src/index.js";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: import-from-json.ts <tracks.json>");

  const tracks = JSON.parse(await readFile(file, "utf8")) as TrackEntry[];
  if (!Array.isArray(tracks)) throw new Error("Input JSON must be an array.");

  const client = createClient({ token: process.env.UWUFUFU_TOKEN });
  if (!process.env.UWUFUFU_TOKEN) {
    const email = process.env.UWUFUFU_EMAIL;
    const password = process.env.UWUFUFU_PASSWORD;
    if (!email || !password) {
      throw new Error("Set UWUFUFU_TOKEN, or UWUFUFU_EMAIL + UWUFUFU_PASSWORD.");
    }
    await client.auth.login(email, password);
  }

  const gameId = process.env.UWUFUFU_GAME_ID
    ? Number(process.env.UWUFUFU_GAME_ID)
    : undefined;
  const create = gameId
    ? undefined
    : {
        title: process.env.UWUFUFU_TITLE ?? "Imported Worldcup",
        description: process.env.UWUFUFU_DESCRIPTION ?? "",
        categoryId: Number(process.env.UWUFUFU_CATEGORY_ID ?? 19),
        isNsfw: process.env.UWUFUFU_NSFW === "true",
      };

  // Persist after each success so a crash/abort is resumable.
  const save = () => writeFile(file, JSON.stringify(tracks, null, 2) + "\n");

  const result = await importTracks(client, {
    tracks,
    gameId,
    create,
    startTime: Number(process.env.UWUFUFU_START ?? 0),
    endTime: Number(process.env.UWUFUFU_END ?? 0),
    onProgress: async (e) => {
      if (e.type === "game") {
        console.log(
          e.created
            ? `Created worldcup #${e.gameId} (${e.slug}).`
            : `Appending to worldcup #${e.gameId}.`,
        );
      } else if (e.type === "added") {
        console.log(`  + ${e.selection.name}`);
        await save();
      } else if (e.type === "skipped") {
        console.log(`  · skip (already added): ${e.track.track_name ?? e.track.url}`);
      } else if (e.type === "error") {
        console.warn(`  ! failed: ${e.track.track_name ?? e.track.url} — ${String(e.error)}`);
      }
    },
  });

  await save();
  console.log(
    `\nDone. added=${result.added} skipped=${result.skipped} failed=${result.failed}`,
  );
  if (result.slug) {
    console.log(`Draft: https://www.uwufufu.com/worldcup/${result.slug}`);
    console.log(`Publish with: client.games.publish(${result.gameId}, { locale: "en" })`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
