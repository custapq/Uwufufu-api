/**
 * Example: create a video worldcup end-to-end and publish it.
 *
 * Run with credentials in env:
 *   UWUFUFU_EMAIL=you@example.com UWUFUFU_PASSWORD=secret npx tsx examples/create-video-game.ts
 *
 * Or skip login by providing a token directly:
 *   UWUFUFU_TOKEN=... npx tsx examples/create-video-game.ts
 *
 * This hits the real api.uwufufu.com and will create a public game on your
 * account. Delete it afterwards if it was just a test.
 */
import { createClient } from "../src/index.js";

const SONGS = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.youtube.com/watch?v=9bZkp7q19f0",
  "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
  "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
];

async function main() {
  const client = createClient({ token: process.env.UWUFUFU_TOKEN });

  if (!process.env.UWUFUFU_TOKEN) {
    const email = process.env.UWUFUFU_EMAIL;
    const password = process.env.UWUFUFU_PASSWORD;
    if (!email || !password) {
      throw new Error(
        "Set UWUFUFU_TOKEN, or UWUFUFU_EMAIL + UWUFUFU_PASSWORD.",
      );
    }
    await client.auth.login(email, password);
    console.log("Logged in.");
  }

  const me = await client.auth.me();
  console.log(`Authenticated as ${me.name} (id ${me.id}).`);

  // 1. Create a draft worldcup (Music category = 16).
  const game = await client.games.create({
    title: "My Song Battle",
    description: "Pick the best track!",
    categoryId: 16,
  });
  console.log(`Created worldcup #${game.id} (${game.slug}).`);

  // 2. Add song selections (the server fetches each title from YouTube).
  for (const url of SONGS) {
    const sel = await client.selections.addVideo({
      worldcupId: game.id,
      url,
      startTime: 0,
      endTime: 30,
    });
    console.log(`  + ${sel.name}`);
  }

  // 3. Publish (visibility -> IS_PUBLIC), keeping the rest of the metadata.
  const published = await client.games.publish(game.id, { locale: "en" });
  console.log(
    `Published: https://www.uwufufu.com/worldcup/${published.slug}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
