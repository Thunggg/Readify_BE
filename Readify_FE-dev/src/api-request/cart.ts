import http from "@/lib/http";
import type { ApiResponse } from "@/types/api";
import type {
  CartItem,
  CartResponse,
  AddToCartDto,
  UpdateCartItemDto,
  UpdateSelectionDto,
  CartCountResponse,
  SelectedItemsResponse,
} from "@/types/cart";

const BASE_URL = "/cart";

export const CartApiRequest = {
  /**
   * Add item to cart
   */
  addToCart(data: AddToCartDto) {
    return http.post<ApiResponse<CartItem>>(BASE_URL, data);
  },

  /**
   * Get user's cart with validation
   */
  getCart() {
    return http.get<ApiResponse<CartResponse>>(BASE_URL);
  },

  /**
   * Get cart item count
   */
  getCartCount() {
    return http.get<ApiResponse<CartCountResponse>>(`${BASE_URL}/count`);
  },

  /**
   * Update item quantity
   */
  updateQuantity(data: UpdateCartItemDto) {
    return http.put<ApiResponse<CartItem>>(BASE_URL, data);
  },

  /**
   * Remove item from cart
   */
  removeFromCart(bookId: string) {
    return http.delete<ApiResponse<null>>(`${BASE_URL}/${bookId}`);
  },

  /**
   * Clear entire cart
   */
  clearCart() {
    return http.delete<ApiResponse<null>>(BASE_URL);
  },

  /**
   * Get single cart item
   */
  getCartItem(bookId: string) {
    return http.get<ApiResponse<CartItem>>(`${BASE_URL}/item/${bookId}`);
  },

  /**
   * Get selected items
   */
  getSelectedItems() {
    return http.get<ApiResponse<SelectedItemsResponse>>(`${BASE_URL}/selected`);
  },

  /**
   * Toggle item selection
   */
  toggleSelectItem(bookId: string) {
    return http.patch<ApiResponse<CartItem>>(`${BASE_URL}/toggle-select/${bookId}`, {});
  },

  /**
   * Update item selection
   */
  updateItemSelection(data: UpdateSelectionDto) {
    return http.patch<ApiResponse<CartItem>>(`${BASE_URL}/update-selection`, data);
  },

  /**
   * Select all items
   */
  selectAllItems() {
    return http.patch<ApiResponse<{ modifiedCount: number }>>(`${BASE_URL}/select-all`, {});
  },

  /**
   * Deselect all items
   */
  deselectAllItems() {
    return http.patch<ApiResponse<{ modifiedCount: number }>>(`${BASE_URL}/deselect-all`, {});
  },
};
