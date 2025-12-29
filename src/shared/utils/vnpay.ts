import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

export interface VnpayConfig {
  tmnCode: string;
  secretKey: string;
  returnUrl: string;
  ipnUrl: string;
  url: string; // VNPay payment gateway URL
}

export interface VnpayPaymentParams {
  vnp_Version: string;
  vnp_Command: string;
  vnp_TmnCode: string;
  vnp_Amount: number; // Amount in VND (multiply by 100)
  vnp_CurrCode: string;
  vnp_TxnRef: string; // Order ID
  vnp_OrderInfo: string;
  vnp_OrderType: string;
  vnp_Locale: string;
  vnp_ReturnUrl: string;
  vnp_IpAddr: string;
  vnp_CreateDate: string; // Format: yyyyMMddHHmmss
  vnp_ExpireDate?: string; // Format: yyyyMMddHHmmss
}

export class VnpayUtil {
  /**
   * Create secure hash for VNPay
   */
  static createSecureHash(data: string, secretKey: string): string {
    return crypto.createHmac('sha512', secretKey).update(data).digest('hex');
  }

  /**
   * Sort and create query string from params
   */
  static createQueryString(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const queryParams: string[] = [];

    for (const key of sortedKeys) {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        queryParams.push(`${key}=${encodeURIComponent(value)}`);
      }
    }

    return queryParams.join('&');
  }

  /**
   * Create payment URL for VNPay
   */
  static createPaymentUrl(params: VnpayPaymentParams, config: VnpayConfig): string {
    // Convert amount to VNPay format (multiply by 100)
    const vnpAmount = params.vnp_Amount * 100;

    const vnpParams: Record<string, any> = {
      vnp_Version: params.vnp_Version || '2.1.0',
      vnp_Command: params.vnp_Command || 'pay',
      vnp_TmnCode: config.tmnCode,
      vnp_Amount: vnpAmount.toString(),
      vnp_CurrCode: params.vnp_CurrCode || 'VND',
      vnp_TxnRef: params.vnp_TxnRef,
      vnp_OrderInfo: params.vnp_OrderInfo,
      vnp_OrderType: params.vnp_OrderType || 'other',
      vnp_Locale: params.vnp_Locale || 'vn',
      vnp_ReturnUrl: config.returnUrl,
      vnp_IpAddr: params.vnp_IpAddr,
      vnp_CreateDate: params.vnp_CreateDate,
    };

    if (params.vnp_ExpireDate) {
      vnpParams.vnp_ExpireDate = params.vnp_ExpireDate;
    }

    // Create query string
    const queryString = this.createQueryString(vnpParams);

    // Create secure hash
    const secureHash = this.createSecureHash(queryString, config.secretKey);

    // Return full URL
    return `${config.url}?${queryString}&vnp_SecureHash=${secureHash}`;
  }

  /**
   * Verify VNPay callback data
   */
  static verifyCallback(data: Record<string, any>, secretKey: string): boolean {
    const secureHash = data.vnp_SecureHash;
    delete data.vnp_SecureHash;
    delete data.vnp_SecureHashType;

    // Create query string
    const queryString = this.createQueryString(data);

    // Create hash to compare
    const hash = this.createSecureHash(queryString, secretKey);

    return hash === secureHash;
  }

  /**
   * Format date to VNPay format (yyyyMMddHHmmss)
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Parse VNPay date format (yyyyMMddHHmmss) to Date
   */
  static parseDate(dateString: string): Date {
    const year = parseInt(dateString.substring(0, 4));
    const month = parseInt(dateString.substring(4, 6)) - 1;
    const day = parseInt(dateString.substring(6, 8));
    const hours = parseInt(dateString.substring(8, 10));
    const minutes = parseInt(dateString.substring(10, 12));
    const seconds = parseInt(dateString.substring(12, 14));

    return new Date(year, month, day, hours, minutes, seconds);
  }
}

