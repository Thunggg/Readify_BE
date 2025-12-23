// src/common/responses/api-response.ts
import { SuccessResponse } from './success.response';
import { PaginatedResponse } from './paginated.response';
import { ErrorResponse, ErrorDetail } from './error.response';

export class ApiResponse {
  // Success response
  static success<T>(data: T, message?: string, statusCode?: number): SuccessResponse<T> {
    return new SuccessResponse<T>(data, message, statusCode);
  }

  // Paginated response
  static paginated<T>(
    items: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string,
  ): PaginatedResponse<T> {
    return new PaginatedResponse<T>(items, pagination, message);
  }

  // Error response
  static error(message: string, errorCode: string, statusCode: number, details?: ErrorDetail[]): ErrorResponse {
    return new ErrorResponse(message, errorCode, statusCode, details);
  }
}
