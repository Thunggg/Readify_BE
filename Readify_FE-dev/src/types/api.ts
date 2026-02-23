export type ApiBaseResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  statusCode: number;
};

export type ApiSuccessResponse<T> = ApiBaseResponse<T> & {
  success: true;
};

export type ApiErrorDetail = {
  field?: string;
  message: string;
  code?: string;
};

export type ApiErrorData = {
  code: string;
  details?: ApiErrorDetail[];
};

export type ApiErrorResponse = ApiBaseResponse<ApiErrorData> & {
  success: false;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
};

export type PaginatedData<T> = {
  items: T[];
  meta?: PaginationMeta;
};

export type ApiPaginatedResponse<T> = ApiResponse<PaginatedData<T>>;
