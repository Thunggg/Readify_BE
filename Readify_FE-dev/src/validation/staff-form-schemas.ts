import { z } from "zod";

const nameRegex = /^[a-zA-ZÀ-ỹ\s'-]+$/;
const passwordRegex = /^(?!.*\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

export const createStaffFormSchema = z.object({
  email: z
    .string()
    .min(1, "Email cannot be empty")
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters"),

  password: z
    .string()
    .min(1, "Password cannot be empty")
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password must be less than 255 characters")
    .regex(
      passwordRegex,
      "Password must contain uppercase, lowercase, number and special character and no spaces"
    ),

  firstName: z
    .string()
    .min(1, "First name cannot be empty")
    .max(100, "First name must be less than 100 characters")
    .regex(
      nameRegex,
      "First name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  lastName: z
    .string()
    .min(1, "Last name cannot be empty")
    .max(100, "Last name must be less than 100 characters")
    .regex(
      nameRegex,
      "Last name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  dateOfBirth: z.string().min(1, "Date of birth cannot be empty").refine(
    (val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const ageDiff = new Date().getFullYear() - date.getFullYear();
      return ageDiff >= 16;
    },
    "You must be at least 16 years old"
  ),

  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .regex(phoneRegex, "Invalid Vietnamese phone number")
    .optional()
    .or(z.literal("")),

  avatarUrl: z
    .string()
    .url("Avatar URL must be a valid URL")
    .max(500, "Avatar URL must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(255, "Address must be less than 255 characters")
    .optional()
    .or(z.literal("")),

  role: z.coerce
    .number()
    .int()
    .refine((val) => [1, 2, 3].includes(val), {
      message: "Role must be 1 (ADMIN), 2 (SELLER), or 3 (WAREHOUSE)",
    }),

  status: z.coerce.number().int().optional(),

  sex: z.coerce.number().int().optional(),
});

export type CreateStaffFormInput = z.infer<typeof createStaffFormSchema>;

export const updateStaffFormSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .optional()
    .or(z.literal("")),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password must be less than 255 characters")
    .regex(
      passwordRegex,
      "Password must contain uppercase, lowercase, number and special character and no spaces"
    )
    .optional()
    .or(z.literal("")),

  firstName: z
    .string()
    .min(1, "First name cannot be empty")
    .max(100, "First name must be less than 100 characters")
    .regex(
      nameRegex,
      "First name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .optional()
    .or(z.literal("")),

  lastName: z
    .string()
    .min(1, "Last name cannot be empty")
    .max(100, "Last name must be less than 100 characters")
    .regex(
      nameRegex,
      "Last name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .optional()
    .or(z.literal("")),

  dateOfBirth: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        if (isNaN(date.getTime())) return false;
        const ageDiff = new Date().getFullYear() - date.getFullYear();
        return ageDiff >= 16;
      },
      "You must be at least 16 years old"
    )
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .regex(phoneRegex, "Invalid Vietnamese phone number")
    .optional()
    .or(z.literal("")),

  avatarUrl: z
    .string()
    .url("Avatar URL must be a valid URL")
    .max(500, "Avatar URL must be less than 500 characters")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(255, "Address must be less than 255 characters")
    .optional()
    .or(z.literal("")),

  role: z.coerce
    .number()
    .int()
    .refine((val) => [1, 2, 3].includes(val), {
      message: "Role must be 1 (ADMIN), 2 (SELLER), or 3 (WAREHOUSE)",
    })
    .optional(),

  status: z.coerce.number().int().optional(),

  sex: z.coerce.number().int().optional(),
});

export type UpdateStaffFormInput = z.infer<typeof updateStaffFormSchema>;
