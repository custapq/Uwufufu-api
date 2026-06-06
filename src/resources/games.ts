import type { HttpClient } from "../http.js";
import type {
  Game,
  Locale,
  Visibility,
  WorldcupPage,
} from "../types.js";

/** Friendly input for {@link GamesResource.create}. */
export interface CreateGameInput {
  title: string;
  description: string;
  categoryId: number;
  /** Defaults to `false`. */
  isNsfw?: boolean;
  /** Defaults to `IS_CLOSED` (draft). */
  visibility?: Visibility;
}

/** Fields you can change via {@link GamesResource.update}. */
export interface UpdateGameInput {
  title?: string;
  description?: string;
  categoryId?: number;
  locale?: Locale;
  isNsfw?: boolean;
  visibility?: Visibility;
  coverImage?: string | null;
}

/** Pagination params for {@link GamesResource.listMine}. */
export interface ListMineParams {
  page?: number;
  limit?: number;
}

/** Worldcup ("game") endpoints. */
export class GamesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * `POST /games` — create a draft worldcup (starts as `IS_CLOSED`).
   */
  create(input: CreateGameInput): Promise<Game> {
    return this.http.request<Game>("POST", "/games", {
      body: {
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        isNsfw: input.isNsfw ?? false,
        visibility: input.visibility ?? "IS_CLOSED",
      },
    });
  }

  /** `GET /games/:id/mine` — one worldcup you own. */
  getMine(id: number): Promise<Game> {
    return this.http.request<Game>("GET", `/games/${id}/mine`);
  }

  /** `GET /games/mine` — worldcups you own (paginated). */
  listMine(params: ListMineParams = {}): Promise<WorldcupPage> {
    return this.http.request<WorldcupPage>("GET", "/games/mine", {
      query: { page: params.page, limit: params.limit },
    });
  }

  /**
   * `PUT /games/:id` — update worldcup metadata.
   *
   * The API's PUT echoes the full resource, so this method first reads the
   * current worldcup ({@link getMine}) and merges your changes over it — that
   * way partial updates can't accidentally blank out other fields. Use
   * {@link replace} if you want to send an exact body yourself.
   */
  async update(id: number, changes: UpdateGameInput): Promise<Game> {
    const current = await this.getMine(id);
    return this.replace(id, {
      title: changes.title ?? current.title,
      description: changes.description ?? current.description,
      visibility: changes.visibility ?? current.visibility,
      categoryId: changes.categoryId ?? current.category?.id,
      locale: changes.locale ?? current.locale ?? undefined,
      isNsfw: changes.isNsfw ?? current.isNsfw,
      coverImage:
        changes.coverImage !== undefined
          ? changes.coverImage
          : current.coverImage,
      slug: current.slug,
    });
  }

  /**
   * `PUT /games/:id` — send an exact update body (escape hatch). Prefer
   * {@link update} unless you know you want full control.
   */
  replace(
    id: number,
    body: {
      title?: string;
      description?: string;
      visibility?: Visibility;
      categoryId?: number;
      locale?: Locale;
      isNsfw?: boolean;
      coverImage?: string | null;
      slug?: string;
    },
  ): Promise<Game> {
    return this.http.request<Game>("PUT", `/games/${id}`, {
      body: { id, ...body },
    });
  }

  /**
   * Publish a worldcup by setting `visibility: IS_PUBLIC`. Optionally set the
   * category and locale at the same time. Reads + merges the current worldcup,
   * so the rest of the metadata is preserved.
   *
   * @example
   * ```ts
   * await client.games.publish(game.id, { categoryId: 16, locale: "en" });
   * ```
   */
  publish(
    id: number,
    options: { categoryId?: number; locale?: Locale } = {},
  ): Promise<Game> {
    return this.update(id, { ...options, visibility: "IS_PUBLIC" });
  }
}
