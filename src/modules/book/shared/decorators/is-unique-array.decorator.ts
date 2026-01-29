import { registerDecorator, ValidationOptions } from 'class-validator';
import { BookUniqueArrayValidator } from '../validators/unique-array.validator';

export function IsBookUniqueArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBookUniqueArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: BookUniqueArrayValidator,
    });
  };
}