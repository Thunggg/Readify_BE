export interface WishlistItem {
  _id: string;
  userId: string;
  bookId: {
    _id: string;
    title: string;
    authors?: string[];
    price?: number;
    discount?: number;
    thumbnailUrl?: string;
    description?: string;
    isbn?: string;
  };
  stockId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddToWishlistDto {
  bookId: string;
}

export interface BulkMoveToCartDto {
  bookIds: string[];
}

export interface BulkRemoveDto {
  bookIds: string[];
}

export interface WishlistCountResponse {
  count: number;
}

export interface CheckWishlistResponse {
  isInWishlist: boolean;
}

export interface BulkMoveToCartResponse {
  success: string[];
  failed: Array<{
    bookId: string;
    reason: string;
  }>;
}

export interface BulkRemoveResponse {
  deletedCount: number;
  requestedCount: number;
}
