import { z } from "zod";

export const createAccountApiSchema = z.object({
  email: z.string().email("Invalid email format").min(5).max(255),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(255),
  firstName: z.string().min(1, "First name can not be empty").max(100),
  lastName: z.string().min(1, "Last name can not be empty").max(100),
  dateOfBirth: z.string().min(1, "Date of birth can not be empty"),
  phone: z.string().min(1, "Phone can not be empty").max(20),
  address: z.string().min(1, "Address can not be empty").max(255),
  status: z.number().int("Status must be a number"),
  sex: z.number().int("Sex must be a number"),
});

export type CreateAccountApiRequest = z.infer<typeof createAccountApiSchema>;

// Không cho phép gửi lên password là "" để không cập nhật password
export const updateAccountApiSchema = z.object({
  email: z.string().email("Invalid email format").min(5).max(255),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(255)
    .optional(),
  firstName: z.string().min(1, "First name can not be empty").max(100),
  lastName: z.string().min(1, "Last name can not be empty").max(100),
  dateOfBirth: z.string().min(1, "Date of birth can not be empty"),
  phone: z
    .string()
    .min(1, "Phone can not be empty")
    .max(20)
    .regex(/^0[0-9]{9}$/, "Invalid phone number"),
  address: z.string().min(1, "Address can not be empty").max(255),
  status: z.number().int("Status must be a number"),
  sex: z.number().int("Sex must be a number"),
});

export type UpdateAccountApiRequest = z.infer<typeof updateAccountApiSchema>;

export const editProfileApiSchema = z.object({
  firstName: z.string().min(1, "First name can not be empty").max(100),
  lastName: z.string().min(1, "Last name can not be empty").max(100),
  dateOfBirth: z.string().min(1, "Date of birth can not be empty"),
  phone: z
    .string()
    .min(1, "Phone can not be empty")
    .max(20)
    .regex(/^0[0-9]{9}$/, "Invalid phone number"),
  address: z.string().min(1, "Address can not be empty").max(255),
  sex: z.number().int("Sex must be a number"),
  bio: z.string().max(500, "Bio must be less than 500 characters long"),
});

export type EditProfileApiRequest = z.infer<typeof editProfileApiSchema>;

export const resetPasswordApiSchema = z.object({
  currentPassword: z
    .string()
    .min(8, "Current password must be at least 8 characters long")
    .max(255),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .max(255),
  confirmPassword: z
    .string()
    .min(8, "Confirm password must be at least 8 characters long")
    .max(255),
});

export type ResetPasswordApiRequest = z.infer<typeof resetPasswordApiSchema>;
