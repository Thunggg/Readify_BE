import { z } from "zod";

const nameRegex = /^[a-zA-ZÀ-ỹ\s'-]+$/;
const passwordRegex = /^(?!.*\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

export const createStaffApiSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters"),

  password: z
    .string()
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

  dateOfBirth: z.string().refine((val) => {
    const date = new Date(val);
    if (isNaN(date.getTime())) return false;
    const ageDiff = new Date().getFullYear() - date.getFullYear();
    return ageDiff >= 16;
  }, "You must be at least 16 years old"),

  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .regex(phoneRegex, "Invalid Vietnamese phone number")
    .optional(),

  avatarUrl: z
    .string()
    .url("Avatar URL must be a valid URL")
    .max(500, "Avatar URL must be less than 500 characters")
    .optional(),

  address: z
    .string()
    .min(1, "Address cannot be empty")
    .max(255, "Address must be less than 255 characters")
    .optional(),

  role: z.coerce.number().int().refine((val) => [1, 2, 3].includes(val), {
    message: "Role must be 1 (ADMIN), 2 (SELLER), or 3 (WAREHOUSE)",
  }),

  status: z.coerce.number().int().optional(),

  sex: z.coerce.number().int().optional(),
});

export type CreateStaffApiRequest = z.infer<typeof createStaffApiSchema>;

export const updateStaffApiSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must be less than 255 characters")
    .optional(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Password must be less than 255 characters")
    .regex(
      passwordRegex,
      "Password must contain uppercase, lowercase, number and special character and no spaces"
    )
    .optional(),

  firstName: z
    .string()
    .min(1, "First name cannot be empty")
    .max(100, "First name must be less than 100 characters")
    .regex(
      nameRegex,
      "First name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .optional(),

  lastName: z
    .string()
    .min(1, "Last name cannot be empty")
    .max(100, "Last name must be less than 100 characters")
    .regex(
      nameRegex,
      "Last name can only contain letters, spaces, hyphens, and apostrophes"
    )
    .optional(),

  dateOfBirth: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const ageDiff = new Date().getFullYear() - date.getFullYear();
      return ageDiff >= 16;
    }, "You must be at least 16 years old")
    .optional(),

  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .regex(phoneRegex, "Invalid Vietnamese phone number")
    .optional(),

  avatarUrl: z
    .string()
    .url("Avatar URL must be a valid URL")
    .max(500, "Avatar URL must be less than 500 characters")
    .optional(),

  address: z
    .string()
    .min(1, "Address cannot be empty")
    .max(255, "Address must be less than 255 characters")
    .optional(),

  role: z.coerce.number().int().refine((val) => [1, 2, 3].includes(val), {
    message: "Role must be 1 (ADMIN), 2 (SELLER), or 3 (WAREHOUSE)",
  }).optional(),

  status: z.coerce.number().int().optional(),

  sex: z.coerce.number().int().optional(),
});

export type UpdateStaffApiRequest = z.infer<typeof updateStaffApiSchema>;
