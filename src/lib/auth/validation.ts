import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Full name is required."),
});

export const profileSchema = z.object({
  currentSubjectTopic: z
    .string()
    .trim()
    .min(3, "Tell us what subject or topic you are working on."),
  targetGoal: z.string().trim().min(3, "Target goal is required."),
  currentSkillLevel: z.string().trim().min(2, "Current skill level is required."),
  deadline: z.string().trim().optional(),
  availableStudyTime: z
    .string()
    .trim()
    .min(2, "Available study time is required."),
  preferredLearningStyle: z
    .string()
    .trim()
    .min(2, "Preferred learning style is required."),
  constraints: z.string().trim().optional(),
  weakAreas: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
