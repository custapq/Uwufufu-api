import type { HttpClient } from "../http.js";
import type { SelectionPage, SelectionSortBy, VideoSelection } from "../types.js";

/** Query params for {@link SelectionsResource.list} and {@link SelectionsResource.listMine}. */
export interface ListSelectionsParams {
  worldcupId: number;
  page?: number;
  perPage?: number;
  keyword?: string;
  sortBy?: SelectionSortBy;
}

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

  /**
   * `GET /selections` — public selection list for a worldcup (includes win/loss stats).
   *
   * No auth required.
   *
   * @example
   * ```ts
   * const page = await client.selections.list({ worldcupId: 123, sortBy: "winLossRatio" });
   * ```
   */
  list(params: ListSelectionsParams): Promise<SelectionPage> {
    return this.http.request<SelectionPage>("GET", "/selections", {
      query: {
        worldcupId: params.worldcupId,
        page: params.page,
        perPage: params.perPage,
        keyword: params.keyword,
        sortBy: params.sortBy,
      },
    });
  }

  /**
   * `GET /selections/mine` — owner's selection list for a worldcup.
   *
   * Requires auth. Returns the same shape as {@link list}.
   */
  listMine(params: ListSelectionsParams): Promise<SelectionPage> {
    return this.http.request<SelectionPage>("GET", "/selections/mine", {
      query: {
        worldcupId: params.worldcupId,
        page: params.page,
        perPage: params.perPage,
        keyword: params.keyword,
        sortBy: params.sortBy,
      },
    });
  }

  /**
   * `DELETE /selections/:id` — permanently delete a selection you own.
   *
   * **Irreversible.**
   */
  delete(id: number): Promise<void> {
    return this.http.request<void>("DELETE", `/selections/${id}`);
  }
}
