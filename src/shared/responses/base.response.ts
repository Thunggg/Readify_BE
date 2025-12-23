// src/common/responses/base.response.ts
export abstract class BaseResponse<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T;
  readonly timestamp: string;
  readonly statusCode: number;

  constructor(success: boolean, message: string, data: T, statusCode: number) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}
