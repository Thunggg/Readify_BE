import { registerDecorator, ValidationOptions } from 'class-validator';
import { SlugValidator } from '../validators/slug.validator';

export function IsSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSlug',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: SlugValidator,
    });
  };
}