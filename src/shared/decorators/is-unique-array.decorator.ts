import { registerDecorator, ValidationOptions } from 'class-validator';
import { UniqueArrayValidator } from '../validators/unique-array.validator';

export function IsUniqueArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: UniqueArrayValidator,
    });
  };
}