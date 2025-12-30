import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Usage: @Roles(AccountRole.ADMIN, AccountRole.SELLER)
export const Roles = (...roles: number[]) => SetMetadata(ROLES_KEY, roles);
