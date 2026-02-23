// src/common/responses/paginated.response.ts
import { BaseResponse } from './base.response';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export class PaginatedResponse<T> extends BaseResponse<PaginatedData<T>> {
  constructor(
    items: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Success',
  ) {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const meta: PaginationMeta = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    };

    super(true, message, { items, meta }, 200);
  }

  // Helper method để tạo response từ TypeORM/Mongoose query
  static fromQueryResult<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    message?: string,
  ): PaginatedResponse<T> {
    return new PaginatedResponse<T>(items, { page, limit, total }, message);
  }
}
