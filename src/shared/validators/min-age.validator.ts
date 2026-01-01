import {
  registerDecorator,
  ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MinAge', async: false })
export class MinAgeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const [minAge] = args.constraints as [number];
    if (typeof value !== 'string' || value.length === 0) return false;

    // nếu ngày sinh không hợp lệ thì trả về false
    const dob = new Date(value);
    if (Number.isNaN(dob.getTime())) return false;

    // nếu ngày sinh lớn hơn ngày hiện tại thì trả về false
    const now = new Date();
    if (dob.getTime() > now.getTime()) return false;

    // tính tuổi (nếu tháng sinh lớn hơn tháng hiện tại thì trừ 1 tuổi)
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age >= minAge;
  }

  defaultMessage(args: ValidationArguments): string {
    const [minAge] = args.constraints as [number];
    return `Must be at least ${minAge} years old`;
  }
}

// minAge → tham số bạn truyền khi dùng @MinAge(16)
// validationOptions → cho phép custom message, groups, etc.
export function MinAge(minAge: number, validationOptions?: ValidationOptions) {
  // object là prototype của class DTO
  // propertyName là tên của property trong class DTO (ví dụ: dateOfBirth)
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      constraints: [minAge],
      options: validationOptions,
      validator: MinAgeConstraint,
    });
  };
}
