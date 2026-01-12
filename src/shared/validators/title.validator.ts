import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidTitle', async: false })
export class TitleValidator implements ValidatorConstraintInterface {
  private readonly MIN_LENGTH = 2;
  private readonly MAX_LENGTH = 60;

  private readonly FILLER_WORDS = [
    'ha', 'ok', 'no', 'uh', 'uhm', 'lol',
    'the', 'a', 'an', 'to', 'of', 'for', 'on'
  ];

  validate(title: string): boolean {
    if (!title || typeof title !== 'string') return false;

    const trimmed = title.trim().replace(/\s+/g, ' ');
    if (trimmed.length < this.MIN_LENGTH || trimmed.length > this.MAX_LENGTH) {
      return false;
    }

    // 1. Must contain at least one letter or number
    if (!/[a-zA-Z0-9À-ỹ]/.test(trimmed)) {
      return false;
    }

    // 2. Block meaningless repeated characters: aaa, !!!, ---
    if (/(.)\1\1/.test(trimmed)) {
      return false;
    }

    // 3. Block repeated filler words: ha ha ha, ok ok ok, the the the
    const words = trimmed.toLowerCase().split(' ');
    for (let i = 0; i <= words.length - 3; i++) {
      const w = words[i];
      if (
        this.FILLER_WORDS.includes(w) &&
        words[i + 1] === w &&
        words[i + 2] === w
      ) {
        return false;
      }
    }

    // 4. Not only numbers
    if (/^\d+$/.test(trimmed.replace(/\s+/g, ''))) {
      return false;
    }

    // 5. No HTML tags
    if (/<[^>]*>/g.test(trimmed)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const title = String(args.value || '');

    const trimmed = title.trim().replace(/\s+/g, ' ');

    if (trimmed.length < this.MIN_LENGTH) {
      return `Title is too short (min ${this.MIN_LENGTH} characters)`;
    }

    if (trimmed.length > this.MAX_LENGTH) {
      return `Title is too long (max ${this.MAX_LENGTH} characters)`;
    }

    if (!/[a-zA-Z0-9À-ỹ]/.test(trimmed)) {
      return 'Title must contain letters or numbers';
    }

    if (/(.)\1\1/.test(trimmed)) {
      return 'Title contains meaningless repeated characters';
    }

    const words = trimmed.toLowerCase().split(' ');
    for (let i = 0; i <= words.length - 3; i++) {
      const w = words[i];
      if (
        this.FILLER_WORDS.includes(w) &&
        words[i + 1] === w &&
        words[i + 2] === w
      ) {
        return 'Title contains meaningless repeated words';
      }
    }

    if (/^\d+$/.test(trimmed.replace(/\s+/g, ''))) {
      return 'Title cannot contain only numbers';
    }

    if (/<[^>]*>/g.test(trimmed)) {
      return 'Title cannot contain HTML tags';
    }

    return 'Title is invalid';
  }
}
