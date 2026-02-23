import http from "@/lib/http";
import type { ApiResponse } from "@/types/api";
import type {
  WishlistItem,
  AddToWishlistDto,
  BulkMoveToCartDto,
  BulkRemoveDto,
  WishlistCountResponse,
  CheckWishlistResponse,
  BulkMoveToCartResponse,
  BulkRemoveResponse,
} from "@/types/wishlist";

const BASE_URL = "/wishlist";

export const WishlistApiRequest = {
  /**
   * Add item to wishlist
   */
  addToWishlist(data: AddToWishlistDto) {
    return http.post<ApiResponse<WishlistItem>>(BASE_URL, data);
  },

  /**
   * Get user's wishlist
   */
  getWishlist() {
    return http.get<ApiResponse<WishlistItem[]>>(BASE_URL);
  },

  /**
   * Get wishlist item count
   */
  getWishlistCount() {
    return http.get<ApiResponse<WishlistCountResponse>>(`${BASE_URL}/count`);
  },

  /**
   * Check if book is in wishlist
   */
  checkBookInWishlist(bookId: string) {
    return http.get<ApiResponse<CheckWishlistResponse>>(
      `${BASE_URL}/check/${bookId}`
    );
  },

  /**
   * Remove item from wishlist
   */
  removeFromWishlist(bookId: string) {
    return http.delete<ApiResponse<{ _id: string }>>(
      `${BASE_URL}/${bookId}`
    );
  },

  /**
   * Clear entire wishlist
   */
  clearWishlist() {
    return http.delete<ApiResponse<{ deletedCount: number }>>(BASE_URL);
  },

  /**
   * Move single item to cart
   */
  moveToCart(bookId: string) {
    return http.post<ApiResponse<null>>(`${BASE_URL}/move-to-cart/${bookId}`, {});
  },

  /**
   * Bulk move items to cart
   */
  bulkMoveToCart(data: BulkMoveToCartDto) {
    return http.post<ApiResponse<BulkMoveToCartResponse>>(
      `${BASE_URL}/bulk-move-to-cart`,
      data
    );
  },

  /**
   * Bulk remove items
   */
  bulkRemove(data: BulkRemoveDto) {
    return http.post<ApiResponse<BulkRemoveResponse>>(
      `${BASE_URL}/bulk-remove`,
      data
    );
  },
};
