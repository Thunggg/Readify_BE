export type AdminAccount = {
  _id?: string;
  id?: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | Date;
  phone?: string;
  avatarUrl?: string;
  address?: string;
  email: string;
  password?: string;
  lastLoginAt?: string | Date;
  status?: number; // 1: active, 0: inactive, -1: banned, 2: not active email
  isDeleted?: boolean;
  role?: number; // 0: user, 1: admin, 2: seller, 3: warehouse manager
  sex?: number; // 1: male, 2: female
  createdAt?: string;
  updatedAt?: string;
};

export type CreateAccountModel = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  role: number; // 0 user, 1 admin, 2 seller, 3 warehouse manager
  status: number; // 1 active, 0 inactive, -1 banned, 2 not active email
  sex: number; // 1 male, 2 female
};

export type UpdateAccountModel = {
  _id: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  role?: number;
  status?: number;
  sex?: number;
};
