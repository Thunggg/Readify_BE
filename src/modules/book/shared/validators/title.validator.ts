// books/shared/validators/book-title.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isBookTitle', async: false })
export class BookTitleValidator implements ValidatorConstraintInterface {
  private readonly MIN_LENGTH = 3;
  private readonly MAX_LENGTH = 200;
  
  // Danh sách từ cấm (có thể lưu trong database/config nếu cần)
  private readonly BANNED_WORDS = [
    'fuck', 'shit', 'damn', 'asshole', 'bitch', 'cunt',
    'địt', 'đụ', 'lồn', 'cặc', 'buồi', 'đĩ', 'cưỡng', 'hiếp'
  ];

  validate(title: string): boolean {
    // 1. Kiểm tra tồn tại và là string
    if (!title || typeof title !== 'string') {
      return false;
    }

    // 2. Kiểm tra độ dài có ý nghĩa (sau khi trim)
    const trimmed = title.trim().replace(/\s+/g, ' ');
    if (trimmed.length < this.MIN_LENGTH || trimmed.length > this.MAX_LENGTH) {
      return false;
    }

    // 3. Không toàn ký tự đặc biệt (phải có ít nhất 1 ký tự chữ/số)
    const withoutSpaces = title.replace(/\s+/g, '');
    if (withoutSpaces.length === 0 || !/[a-zA-Z0-9À-ỹ]/.test(withoutSpaces)) {
      return false;
    }

    // 4. Không lặp ký tự vô nghĩa (3+ ký tự giống nhau liên tiếp)
    if (/(.)\1\1/.test(title)) {
      return false;
    }

    // 5. Không lặp từ ngắn vô nghĩa (ví dụ: "test test test")
    if (/(\b\w{1,3}\b)(\s+\1){2,}/i.test(title)) {
      return false;
    }

    // 6. Không toàn chữ in hoa (cho phép viết hoa đầu câu/từ)
    const lettersOnly = title.replace(/[^a-zA-ZÀ-Ỹ]/g, '');
    if (lettersOnly.length > 0 && /^[A-ZÀ-Ỹ\s]+$/.test(title)) {
      // Cho phép nếu chỉ có 1 từ và viết hoa (ví dụ: "BOOK", "HTML")
      const words = title.trim().split(/\s+/);
      if (words.length > 1) {
        return false;
      }
    }

    // 7. Không phải số thuần
    const numbersOnly = title.replace(/[^\d]/g, '');
    if (numbersOnly === title.replace(/\s+/g, '')) {
      return false;
    }

    // 8. Không chứa từ cấm
    const lowerTitle = title.toLowerCase();
    if (this.BANNED_WORDS.some(word => lowerTitle.includes(word))) {
      return false;
    }

    // 9. Không có HTML tags
    if (/<[^>]*>/g.test(title)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const title = args.value as string;
    
    if (!title || typeof title !== 'string') {
      return 'Book title must be a string';
    }

    const trimmed = title.trim().replace(/\s+/g, ' ');
    
    // Kiểm tra cụ thể từng trường hợp để có message rõ ràng
    if (trimmed.length < this.MIN_LENGTH) {
      return `Book title is too short (minimum ${this.MIN_LENGTH} characters)`;
    }
    
    if (trimmed.length > this.MAX_LENGTH) {
      return `Book title is too long (maximum ${this.MAX_LENGTH} characters)`;
    }

    const withoutSpaces = title.replace(/\s+/g, '');
    if (withoutSpaces.length === 0 || !/[a-zA-Z0-9À-ỹ]/.test(withoutSpaces)) {
      return 'Book title cannot consist only of special characters';
    }

    if (/(.)\1\1/.test(title)) {
      return 'Book title contains meaningless repeated characters';
    }

    if (/(\b\w{1,3}\b)(\s+\1){2,}/i.test(title)) {
      return 'Book title contains meaningless repeated words';
    }

    const lettersOnly = title.replace(/[^a-zA-ZÀ-Ỹ]/g, '');
    if (lettersOnly.length > 0 && /^[A-ZÀ-Ỹ\s]+$/.test(title)) {
      const words = title.trim().split(/\s+/);
      if (words.length > 1) {
        return 'Book title cannot be all uppercase letters';
      }
    }

    const numbersOnly = title.replace(/[^\d]/g, '');
    if (numbersOnly === title.replace(/\s+/g, '')) {
      return 'Book title cannot consist only of numbers';
    }

    const lowerTitle = title.toLowerCase();
    if (this.BANNED_WORDS.some(word => lowerTitle.includes(word))) {
      return 'Book title contains inappropriate language';
    }

    if (/<[^>]*>/g.test(title)) {
      return 'Book title cannot contain HTML tags';
    }

    return 'Book title is invalid';
  }
}