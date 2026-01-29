// books/shared/validators/book-unique-array.validator.ts
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isBookUniqueArray', async: false })
export class BookUniqueArrayValidator implements ValidatorConstraintInterface {
  validate(array: any[]): boolean {
    if (!Array.isArray(array)) {
      return true; // Nếu không phải array, để decorator @IsArray xử lý
    }

    // Kiểm tra trùng lặp với Set
    const uniqueSet = new Set(array);
    return uniqueSet.size === array.length;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must not contain duplicate values`;
  }
}