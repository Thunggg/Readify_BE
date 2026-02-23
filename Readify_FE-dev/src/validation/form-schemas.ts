import { z } from "zod";

const ROLE_VALUES = [0, 1, 2, 3] as const;

export const createAccountFormSchema = z.object({
  email: z.string().email("Invalid email format").min(5).max(255),

  password: z
    .string()
    .min(1, "Password can not be empty")
    .min(6, "Password must be at least 6 characters long")
    .max(255, "Password must be less than 255 characters long"),

  firstName: z
    .string()
    .max(100, "First name must be less than 100 characters long")
    .min(1, "First name can not be empty"),

  lastName: z
    .string()
    .max(100, "Last name must be less than 100 characters long")
    .min(1, "Last name can not be empty"),

  dateOfBirth: z.string().min(1, "Date of birth can not be empty"),

  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters long")
    .min(1, "Phone can not be empty")
    .regex(/^0[0-9]{9}$/, "Invalid phone number"),

  address: z
    .string()
    .max(255, "Address must be less than 255 characters long")
    .min(1, "Address can not be empty"),

  status: z.number().int("Status must be a number"),

  sex: z.number().int("Sex must be a number"),
});

export type CreateAccountFormInput = z.infer<typeof createAccountFormSchema>;

// Cho phép gửi lên password là "" để không cập nhật password
export const updateAccountFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email can not be empty")
    .min(5, "Email must be at least 5 characters long")
    .max(255, "Email must be less than 255 characters long")
    .email("Invalid email format"),

  password: z.string(), // allow ""

  firstName: z
    .string()
    .max(100, "First name must be less than 100 characters long")
    .min(1, "First name can not be empty"),

  lastName: z
    .string()
    .max(100, "Last name must be less than 100 characters long")
    .min(1, "Last name can not be empty"),

  dateOfBirth: z.string().min(1, "Date of birth can not be empty"),

  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters long")
    .min(1, "Phone can not be empty"),

  address: z
    .string()
    .max(255, "Address must be less than 255 characters long")
    .min(1, "Address can not be empty"),

  role: z
    .number()
    .int("Role must be a number")
    .refine((val) => ROLE_VALUES.includes(val as any), {
      message: "Role must be one of 0,1,2,3",
    }),

  status: z.number().int("Status must be a number"),

  sex: z.number().int("Sex must be a number"),
});

export type UpdateAccountFormInput = z.infer<typeof updateAccountFormSchema>;

export const editProfileFormSchema = z.object({
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

export type EditProfileFormInput = z.infer<typeof editProfileFormSchema>;

export const resetPasswordFormSchema = z
  .object({
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
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;
