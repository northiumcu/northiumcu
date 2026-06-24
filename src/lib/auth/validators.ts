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

export const signupSchema = z
  .object({
    username: usernameSchema,
    email: z.string().email(),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    phone: z.string().min(7).max(20).optional(),
    pin: pinSchema,
    confirmPin: pinSchema,
    eligibilityCategory: z.string().min(1).max(120),
    requestedAccountTypes: z
      .array(accountTypeSchema)
      .min(1, "Select at least one account type."),
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
});

export const otpVerifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
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
  ]),
  amount: z.number().positive().max(1_000_000),
  memo: z.string().max(200).optional(),
  destinationAccountId: z.string().uuid().optional(),
  beneficiaryName: z.string().max(120).optional(),
  beneficiaryBank: z.string().max(120).optional(),
  destinationRoutingNumber: z.string().max(20).optional(),
  destinationAccountNumber: z.string().max(34).optional(),
  zelleContact: z.string().max(120).optional(),
  wireSwift: z.string().max(20).optional(),
  wireIban: z.string().max(40).optional(),
  wireCountry: z.string().max(80).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type KycSubmitInput = z.infer<typeof kycSubmitSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TransferCreateInput = z.infer<typeof transferCreateSchema>;
