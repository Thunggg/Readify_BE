// books/shared/decorators/is-book-title.decorator.ts
import { registerDecorator, ValidationOptions } from 'class-validator';
import { BookTitleValidator } from '../validators/title.validator';

export function IsBookTitle(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBookTitle',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: BookTitleValidator,
    });
  };
}