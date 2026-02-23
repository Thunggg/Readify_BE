import http from "@/lib/http";
import type { ApiResponse, ApiPaginatedResponse } from "@/types/api";
import type {
  PublicBook,
  PublicBookDetail,
  SearchPublicBooksParams,
  BookSuggestion,
  SearchBookSuggestion,
} from "@/types/book";

const BASE_PUBLIC = "/book";
const BASE_ADMIN = "/admin/book";

const withCookie = (accessToken?: string) => ({
  "Content-Type": "application/json",
  ...(accessToken ? { Cookie: `accessToken=${accessToken}` } : {}),
});
const safe = (v?: string | null) => (typeof v === "string" ? v.trim() : "");

export const BookApiRequest = {
  // PUBLIC (guest + logged-in)

  getBooks(params?: SearchPublicBooksParams, accessToken?: string) {
    return http.get<ApiPaginatedResponse<PublicBook>>(BASE_PUBLIC, {
      params,
      headers: withCookie(accessToken),
    });
  },

  /** Get book detail by slug */
  getBySlug: (slug: string, accessToken?: string) => {
    const s = safe(slug);
    return http.get<{ data: PublicBookDetail }>(`/book/slug/${s}`, {
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Cookie: `accessToken=${accessToken}` } : {}),
      },
    });
  },

  /** Get book detail by id */
  getById(bookId: string, accessToken?: string) {
    return http.get<ApiResponse<PublicBookDetail>>(
      `${BASE_PUBLIC}/${safe(bookId)}`,
      {
        headers: withCookie(accessToken),
      }
    );
  },

  /** Related books by slug */
  getRelatedBySlug(slug: string, limit?: number, accessToken?: string) {
    return http.get<ApiResponse<PublicBook[]>>(
      `${BASE_PUBLIC}/slug/${safe(slug)}/related`,
      {
        params: limit ? { limit } : undefined,
        headers: withCookie(accessToken),
      }
    );
  },

  /** Related books by id */
  getRelatedById(bookId: string, limit?: number, accessToken?: string) {
    return http.get<ApiResponse<PublicBook[]>>(
      `${BASE_PUBLIC}/${safe(bookId)}/related`,
      {
        params: limit ? { limit } : undefined,
        headers: withCookie(accessToken),
      }
    );
  },

  /** Search suggestions (autocomplete) */
  getSuggestions(params?: SearchBookSuggestion, accessToken?: string) {
    return http.get<ApiResponse<BookSuggestion[]>>(
      `${BASE_PUBLIC}/suggestions`,
      {
        params,
        headers: withCookie(accessToken),
      }
    );
  },

  // ADMIN (login required)

  adminGetBooks(accessToken: string, params?: Record<string, any>) {
    return http.get<ApiPaginatedResponse<any>>(BASE_ADMIN, {
      params,
      headers: withCookie(accessToken),
    });
  },

  adminGetById(accessToken: string, bookId: string) {
    return http.get<ApiResponse<any>>(`${BASE_ADMIN}/${safe(bookId)}`, {
      headers: withCookie(accessToken),
    });
  },

  adminCreate(accessToken: string, body: Record<string, any>) {
    return http.post<ApiResponse<any>>(BASE_ADMIN, body, {
      headers: withCookie(accessToken),
    });
  },

  adminUpdate(accessToken: string, bookId: string, body: Record<string, any>) {
    return http.put<ApiResponse<any>>(`${BASE_ADMIN}/${safe(bookId)}`, body, {
      headers: withCookie(accessToken),
    });
  },

  adminDelete(accessToken: string, bookId: string) {
    return http.delete<ApiResponse<any>>(
      `${BASE_ADMIN}/${safe(bookId)}`,
      null,
      {
        headers: withCookie(accessToken),
      }
    );
  },

  adminRestore(accessToken: string, bookId: string) {
    return http.put<ApiResponse<any>>(
      `${BASE_ADMIN}/${safe(bookId)}/restore`,
      null,
      {
        headers: withCookie(accessToken),
      }
    );
  },
};
