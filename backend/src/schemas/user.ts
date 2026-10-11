import z from "zod";

export const emailSchema = z
  .email("Invalid email address")
  .min(1, "Email is required");

export const passwordSchema = z
  .string()
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character.",
    },
  );

export const userSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, "Name is Required"),
  password: passwordSchema,
  role: z.enum(["USER", "ADMIN"], "Role is not found"),
});

export const partialuserSchema = z
  .object({
    name: z.string().min(1, "Name is Required"),
    email: emailSchema,
    role: z.enum(["USER", "ADMIN"], "Role is not found"),
    profilePicture: z.string(),
  })
  .partial();

export const passwordUpdateSchema = z.object({
  email: emailSchema.optional(),
  oldPassword: z.string().min(1, "Old Password is Required"),
  newPassword: passwordSchema,
});
