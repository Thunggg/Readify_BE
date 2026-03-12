import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'isUniqueArray', async: false })
export class UniqueArrayValidator implements ValidatorConstraintInterface {
  validate(array: any[], args?: ValidationArguments): boolean {
    // 1. Kiểm tra có phải array không
    if (!Array.isArray(array)) {
      return true; // Để @IsArray validation xử lý
    }

    // 2. Kiểm tra trùng lặp với Set
    const uniqueSet = new Set(array);
    
    // 3. Có thể kiểm tra thêm: không có giá trị null/undefined
    const hasInvalidValues = array.some(item => 
      item === null || item === undefined || item === ''
    );
    
    if (hasInvalidValues) {
      return false;
    }

    return uniqueSet.size === array.length;
  }

  defaultMessage(args: ValidationArguments): string {
    const array = args.value as any[];
    
    if (!Array.isArray(array)) {
      return `${args.property} must be an array`;
    }

    // Kiểm tra có giá trị null/undefined không
    const hasInvalidValues = array.some(item => 
      item === null || item === undefined || item === ''
    );
    
    if (hasInvalidValues) {
      return `${args.property} cannot contain null, undefined, or empty values`;
    }

    // Kiểm tra trùng lặp
    const uniqueSet = new Set(array);
    if (uniqueSet.size !== array.length) {
      return `${args.property} must not contain duplicate values`;
    }

    return `${args.property} is invalid`;
  }
}