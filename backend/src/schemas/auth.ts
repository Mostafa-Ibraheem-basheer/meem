import z from "zod";
import { emailSchema } from "./user.js";

export const idParamSchema = z.coerce.string();

export const loginDetailsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "No Password Was provided"),
});
