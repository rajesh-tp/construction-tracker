import { z } from "zod";

export const CONTRACTOR_TYPES = [
  "Building Contractor",
  "Electrical Contractor",
  "Plumbing Contractor",
  "Painting Contractor",
  "Flooring Contractor",
  "Interior Contractor",
  "Landscaping Contractor",
  "Carpentry Contractor",
  "Architect",
  "Other",
] as const;

export const TRANSACTION_CATEGORIES = [
  "Material Purchase",
  "Labour Payment",
  "Contractor Payment",
  "Earth Work",
  "Transport",
  "Equipment Rental",
  "Permits & Fees",
  "Utilities",
  "Miscellaneous",
] as const;

export const TRANSACTION_TYPES = ["expense", "payment", "adjustment"] as const;

export const contractorSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  contractorType: z.enum(CONTRACTOR_TYPES, { message: "Select a contractor type" }),
  contactPhone: z.string().max(20).optional().default(""),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  initialBalance: z.coerce.number().min(0, "Balance cannot be negative").default(0),
});

export const transactionSchema = z.object({
  accountId: z.coerce.number().int().positive("Select an account"),
  date: z.string().min(1, "Date is required"),
  description: z.string().min(1, "Description is required").max(200),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(TRANSACTION_TYPES, { message: "Select a transaction type" }),
  category: z.enum(TRANSACTION_CATEGORIES, { message: "Select a category" }),
  notes: z.string().max(500).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const constructionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(500).optional().default(""),
});

export const USER_ROLES = ["superadmin", "owner", "contractor"] as const;

export const userManageSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required"),
  role: z.enum(USER_ROLES, { message: "Select a role" }),
  password: z.string().optional().default(""),
}).refine(
  (data) => {
    if (data.password && data.password.length < 6) return false;
    return true;
  },
  { message: "Password must be at least 6 characters", path: ["password"] },
);

export const accountBalanceSchema = z.object({
  initialBalance: z.coerce.number().min(0, "Balance cannot be negative"),
});

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required"),
  currentPassword: z.string().optional().default(""),
  newPassword: z.string().optional().default(""),
}).refine(
  (data) => {
    // If new password is provided, current password must also be provided
    if (data.newPassword && !data.currentPassword) return false;
    return true;
  },
  { message: "Current password is required to set a new password", path: ["currentPassword"] },
).refine(
  (data) => {
    // If new password is provided, it must be at least 6 chars
    if (data.newPassword && data.newPassword.length < 6) return false;
    return true;
  },
  { message: "New password must be at least 6 characters", path: ["newPassword"] },
);
