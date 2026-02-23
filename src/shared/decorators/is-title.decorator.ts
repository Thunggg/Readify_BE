import { registerDecorator, ValidationOptions } from 'class-validator';
import { TitleValidator } from '../validators/title.validator';

export function IsTitle(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isTitle',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: TitleValidator,
    });
  };
}