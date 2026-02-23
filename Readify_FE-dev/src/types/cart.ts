export interface CartItem {
  _id: string;
  userId: string;
  bookId: string;
  quantity: number;
  isSelected: boolean;
  book?: {
    _id: string;
    title: string;
    slug?: string;
    thumbnailUrl?: string;
    author?: string[];
    authors?: string[];
    basePrice: number;
    currency?: string;
    isInStock?: boolean;
    isbn?: string;
    coverUrl?: string;
    pages?: number;
    publisher?: string;
    description?: string;
    categories?: string[];
    publishedDate?: string;
  };
  stock?: {
    quantity: number;
    price?: number;
    status?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StockValidation {
  updated: Array<{
    bookId: string;
    oldQuantity: number;
    newQuantity: number;
  }>;
  removed: Array<{
    bookId: string;
    oldQuantity: number;
    reason: string;
  }>;
  warnings: Array<{
    bookId: string;
    message: string;
    availableStock?: number;
  }>;
}

export interface CartResponse {
  items: CartItem[];
  validation?: StockValidation;
}

export interface AddToCartDto {
  bookId: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  bookId: string;
  quantity: number;
}

export interface UpdateSelectionDto {
  bookId: string;
  isSelected: boolean;
}

export interface CartCountResponse {
  count: number;
}

export interface SelectedItemsResponse {
  items: CartItem[];
  totalAmount: number;
}
