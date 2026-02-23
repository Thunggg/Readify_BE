// src/common/responses/success.response.ts
import { BaseResponse } from './base.response';

export class SuccessResponse<T> extends BaseResponse<T> {
  constructor(data: T, message: string = 'Success', statusCode: number = 200) {
    super(true, message, data, statusCode);
  }
}
