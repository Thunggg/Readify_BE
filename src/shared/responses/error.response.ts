// src/common/responses/error.response.ts
import { BaseResponse } from './base.response';

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ErrorData {
  code: string;
  message: string;
  details?: ErrorDetail[];
}

export class ErrorResponse extends BaseResponse<ErrorData> {
  constructor(
    message: string,
    errorCode: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    details?: ErrorDetail[],
  ) {
    const errorData: ErrorData = {
      code: errorCode,
      message,
      details,
    };

    super(false, message, errorData, statusCode);
  }

  // Factory methods cho các lỗi phổ biến
  static badRequest(message: string = 'Bad Request', details?: ErrorDetail[]): ErrorResponse {
    return new ErrorResponse(message, 'BAD_REQUEST', 400, details);
  }

  static unauthorized(message: string = 'Unauthorized'): ErrorResponse {
    return new ErrorResponse(message, 'UNAUTHORIZED', 401);
  }

  static forbidden(message: string = 'Forbidden'): ErrorResponse {
    return new ErrorResponse(message, 'FORBIDDEN', 403);
  }

  static notFound(message: string = 'Not Found'): ErrorResponse {
    return new ErrorResponse(message, 'NOT_FOUND', 404);
  }

  static validationError(details: ErrorDetail[], message: string = 'Validation Error'): ErrorResponse {
    return new ErrorResponse(message, 'VALIDATION_ERROR', 422, details);
  }

  static internal(message: string = 'Internal Server Error'): ErrorResponse {
    return new ErrorResponse(message, 'INTERNAL_ERROR', 500);
  }
}
