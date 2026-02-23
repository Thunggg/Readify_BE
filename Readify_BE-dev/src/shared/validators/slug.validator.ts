// src/shared/validators/slug.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isValidSlug', async: false })
export class SlugValidator implements ValidatorConstraintInterface {
  private readonly MIN_LENGTH = 2;
  private readonly MAX_LENGTH = 120;

  validate(slug: string, args?: ValidationArguments): boolean {
    // 1. Kiểm tra tồn tại và là string
    if (!slug || typeof slug !== 'string') {
      return false;
    }

    const trimmedSlug = slug.trim();
    
    // 2. Kiểm tra độ dài
    if (trimmedSlug.length < this.MIN_LENGTH || trimmedSlug.length > this.MAX_LENGTH) {
      return false;
    }

    // 3. Định dạng slug: chữ thường, số, gạch ngang
    // Cho phép: "the-great-gatsby", "dac-nhan-tam", "toan-12"
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(trimmedSlug)) {
      return false;
    }

    // 4. Không bắt đầu hoặc kết thúc bằng gạch ngang
    if (trimmedSlug.startsWith('-') || trimmedSlug.endsWith('-')) {
      return false;
    }

    // 5. Không có hai gạch ngang liên tiếp
    if (trimmedSlug.includes('--')) {
      return false;
    }

    // 6. Không phải số thuần (tuỳ chọn, nếu muốn)
    const numbersOnly = trimmedSlug.replace(/[^0-9]/g, '');
    if (numbersOnly === trimmedSlug) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const slug = args.value as string;
    
    if (!slug || typeof slug !== 'string') {
      return 'Slug must be a string';
    }

    const trimmedSlug = slug.trim();
    
    if (trimmedSlug.length < this.MIN_LENGTH) {
      return `Slug is too short (minimum ${this.MIN_LENGTH} characters)`;
    }
    
    if (trimmedSlug.length > this.MAX_LENGTH) {
      return `Slug is too long (maximum ${this.MAX_LENGTH} characters)`;
    }

    // Kiểm tra định dạng cụ thể để có message rõ ràng
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)) {
      return 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (trimmedSlug.startsWith('-') || trimmedSlug.endsWith('-')) {
      return 'Slug cannot start or end with a hyphen';
    }

    if (trimmedSlug.includes('--')) {
      return 'Slug cannot contain consecutive hyphens';
    }

    const numbersOnly = trimmedSlug.replace(/[^0-9]/g, '');
    if (numbersOnly === trimmedSlug) {
      return 'Slug cannot consist only of numbers';
    }

    return 'Slug is invalid';
  }
}