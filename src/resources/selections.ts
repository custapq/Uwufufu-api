import type { HttpClient } from "../http.js";
import type { VideoSelection } from "../types.js";

/** Friendly input for {@link SelectionsResource.addVideo}. */
export interface AddVideoInput {
  /** The worldcup (game) id to add this selection to. */
  worldcupId: number;
  /** A YouTube watch URL. */
  url: string;
  /** Clip start, in seconds. Defaults to `0`. */
  startTime?: number;
  /** Clip end, in seconds. Defaults to `0` (play full video). */
  endTime?: number;
}

/** Selection (bracket entry) endpoints. */
export class SelectionsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * `POST /selections/video` — add a YouTube selection to a worldcup.
   *
   * The server fetches the video title and derives the embed URL + thumbnail.
   *
   * @example
   * ```ts
   * await client.selections.addVideo({
   *   worldcupId: game.id,
   *   url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
   *   startTime: 0,
   *   endTime: 30,
   * });
   * ```
   */
  addVideo(input: AddVideoInput): Promise<VideoSelection> {
    return this.http.request<VideoSelection>("POST", "/selections/video", {
      body: {
        worldcupId: input.worldcupId,
        resourceUrl: input.url,
        startTime: input.startTime ?? 0,
        endTime: input.endTime ?? 0,
      },
    });
  }
}
