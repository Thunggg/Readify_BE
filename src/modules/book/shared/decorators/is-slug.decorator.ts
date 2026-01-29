// books/shared/decorators/is-book-slug.decorator.ts
import { registerDecorator, ValidationOptions } from 'class-validator';
import { BookSlugValidator } from '../validators/slug.validator';

export function IsBookSlug(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBookSlug',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: BookSlugValidator,
    });
  };
}