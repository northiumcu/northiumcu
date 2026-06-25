import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(24, "Username must be at most 24 characters.")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Username may only contain letters, numbers, dots, dashes, and underscores."
  );

export const pinSchema = z
  .string()
  .regex(/^\d{6}$/, "Account PIN must be exactly 6 digits.");

export const ROUTING_NUMBER_LENGTH = 9;

export const routingNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{9}$/, "Routing number must be exactly 9 digits.");

export function sanitizeRoutingNumberInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, ROUTING_NUMBER_LENGTH);
}

/** Treat blank optional request fields as undefined so Zod optional() works. */
export function optionalEmpty<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    schema
  );
}

export const optionalRoutingNumberSchema = optionalEmpty(routingNumberSchema.optional());

export const ssnSchema = z
  .string()
  .regex(/^\d{3}-?\d{2}-?\d{4}$/, "Enter a valid 9-digit SSN.");

export const accountTypeSchema = z.enum([
  "checking",
  "savings",
  "certificate",
  "youth",
  "business",
  "retirement",
]);

export const primaryAccountTypeSchema = z.enum([
  "checking",
  "certificate",
  "youth",
  "business",
  "retirement",
]);

export const humanCheckSchema = z.object({
  humanCheckToken: z.string().min(1, "Complete the verification question."),
  humanCheckAnswer: z.coerce
    .number()
    .int("Enter a whole number.")
    .min(2)
    .max(18),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().email("Enter a valid email address."),
  topic: z.enum(["general", "account", "membership", "loans", "security"]),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(5000),
  humanCheckToken: humanCheckSchema.shape.humanCheckToken,
  humanCheckAnswer: humanCheckSchema.shape.humanCheckAnswer,
});

export const signupSchema = z
  .object({
    username: usernameSchema,
    email: z.string().email(),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    phone: z
      .string()
      .optional()
      .transform((value) => {
        const digits = (value ?? "").replace(/\D/g, "");
        return digits.length > 0 ? digits : undefined;
      })
      .refine((value) => value === undefined || value.length === 10, {
        message: "Phone number must be 10 digits.",
      }),
    pin: pinSchema,
    confirmPin: pinSchema,
    eligibilityCategory: z.string().min(1).max(120),
    requestedAccountType: primaryAccountTypeSchema,
    humanCheckToken: humanCheckSchema.shape.humanCheckToken,
    humanCheckAnswer: humanCheckSchema.shape.humanCheckAnswer,
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs do not match.",
    path: ["confirmPin"],
  });

export const kycSubmitSchema = z
  .object({
    ssn: ssnSchema,
    idDocumentType: z.enum(["drivers_license", "state_id", "passport"]),
    idDocumentNumber: z.string().min(4).max(32),
    idDocumentFront: z.string().min(64, "Upload the front of your ID."),
    idDocumentBack: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.idDocumentType !== "passport" && !data.idDocumentBack) {
      ctx.addIssue({
        code: "custom",
        message: "Upload the back of your ID.",
        path: ["idDocumentBack"],
      });
    }
  });

export const loginSchema = z.object({
  username: usernameSchema,
  pin: pinSchema,
  next: z.string().optional(),
});

export const staffPasswordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(128, "Password must be at most 128 characters.")
  .regex(/[A-Z]/, "Include at least one uppercase letter.")
  .regex(/[a-z]/, "Include at least one lowercase letter.")
  .regex(/\d/, "Include at least one number.")
  .regex(/[^A-Za-z0-9]/, "Include at least one symbol.");

export const staffLoginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: staffPasswordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
  });

export const otpVerifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const signupStatusSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const signupResendSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const adminCreateMemberSchema = z
  .object({
    username: usernameSchema,
    email: z.string().email(),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z
      .string()
      .optional()
      .transform((value) => {
        const digits = (value ?? "").replace(/\D/g, "");
        return digits.length > 0 ? digits : undefined;
      })
      .refine((value) => value === undefined || value.length === 10, {
        message: "Phone number must be 10 digits.",
      }),
    pin: pinSchema,
    confirmPin: pinSchema,
    eligibilityCategory: z.string().min(1).max(120).optional(),
    requestedAccountType: primaryAccountTypeSchema,
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs do not match.",
    path: ["confirmPin"],
  });

export const forgotPinSchema = z.object({
  username: usernameSchema,
});

export const resetPinSchema = z
  .object({
    challengeId: z.string().uuid(),
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
    newPin: pinSchema,
    confirmPin: pinSchema,
  })
  .refine((data) => data.newPin === data.confirmPin, {
    message: "PINs do not match.",
    path: ["confirmPin"],
  });

export const transferCreateSchema = z.object({
  sourceAccountId: z.string().uuid(),
  type: z.enum([
    "internal",
    "ach",
    "direct_deposit",
    "local_wire",
    "international_wire",
    "zelle",
    "bill_pay",
  ]),
  amount: z.number().positive().max(1_000_000),
  memo: optionalEmpty(z.string().max(200).optional()),
  destinationAccountId: optionalEmpty(z.string().uuid().optional()),
  payeeId: optionalEmpty(z.string().uuid().optional()),
  beneficiaryName: optionalEmpty(z.string().max(120).optional()),
  beneficiaryBank: optionalEmpty(z.string().max(120).optional()),
  destinationRoutingNumber: optionalRoutingNumberSchema,
  destinationAccountNumber: optionalEmpty(z.string().max(34).optional()),
  zelleContact: optionalEmpty(z.string().max(120).optional()),
  wireSwift: optionalEmpty(z.string().max(20).optional()),
  wireIban: optionalEmpty(z.string().max(40).optional()),
  wireCountry: optionalEmpty(z.string().max(80).optional()),
  cotCode: optionalEmpty(z.string().max(32).optional()),
  imfCode: optionalEmpty(z.string().max(32).optional()),
  pin: pinSchema,
});

export const billPayPayeeSchema = z.object({
  nickname: z.string().trim().min(1).max(60),
  payeeName: z.string().trim().min(1).max(120),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{4,17}$/, "Account number must be 4 to 17 digits."),
  category: z.string().trim().max(60).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TransferCreateInput = z.infer<typeof transferCreateSchema>;
