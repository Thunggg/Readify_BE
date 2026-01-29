// books/shared/validators/book-slug.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'isBookSlug', async: false })
export class BookSlugValidator implements ValidatorConstraintInterface {
  private readonly MIN_LENGTH = 3;
  private readonly MAX_LENGTH = 200;

  validate(slug: string): boolean {
    if (!slug || typeof slug !== 'string') {
      return false;
    }

    const trimmedSlug = slug.trim();
    
    // 1. Kiểm tra độ dài
    if (trimmedSlug.length < this.MIN_LENGTH || trimmedSlug.length > this.MAX_LENGTH) {
      return false;
    }

    // 2. Định dạng slug: chữ thường, số, gạch ngang
    // Cho phép: "the-great-gatsby", "dac-nhan-tam", "toan-12"
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(trimmedSlug)) {
      return false;
    }

    // 3. Không bắt đầu hoặc kết thúc bằng gạch ngang
    if (trimmedSlug.startsWith('-') || trimmedSlug.endsWith('-')) {
      return false;
    }

    // 4. Không có hai gạch ngang liên tiếp
    if (trimmedSlug.includes('--')) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return `Book slug must be between ${this.MIN_LENGTH} and ${this.MAX_LENGTH} characters, contain only lowercase letters, numbers, and hyphens, and cannot start/end with hyphens`;
  }
}