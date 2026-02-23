export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  FILE = "file",
}

export enum MediaStatus {
  TEMP = "TEMP",
  ATTACHED = "ATTACHED",
}

export enum MediaFolder {
  BOOK = "book",
  BANNER = "banner",
  ACCOUNT = "account",
  PRODUCT = "product",
  CATEGORY = "category",
  SUBCATEGORY = "subcategory",
  BRAND = "brand",
  USER = "user",
  ORDER = "order",
  PAYMENT = "payment",
  REVIEW = "review",
}

export type Media = {
  _id: string;
  url: string;
  publicId: string;
  type: MediaType;
  folder: MediaFolder;
  status: string;
  uploadedBy?: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt?: string;
  updatedAt?: string;
};

export type UploadMediaDto = {
  type: MediaType;
  folder: MediaFolder;
};
