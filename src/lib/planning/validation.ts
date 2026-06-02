import { practiceTestSchema, roadmapSchema } from "@/lib/agents/schemas";
import { z } from "zod";

export const contextNotesSchema = z.object({
  extraNotes: z.string().trim().optional(),
});

export const followUpAnswerSchema = z.object({
  followUpId: z.string().trim().min(1),
  answer: z.string().trim().min(2, "Please add a short answer."),
});

export const roadmapEditPayloadSchema = roadmapSchema;

export const taskStatusSchema = z.object({
  taskId: z.string().trim().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
});

export const resourceStatusSchema = z.object({
  resourceId: z.string().trim().min(1),
  status: z.enum(["SAVED", "COMPLETED"]),
});

export const practiceTestRequestSchema = z.object({
  focusArea: z.string().trim().optional(),
  testFormat: z.enum(["ADAPTIVE", "QUIZ", "MIXED", "CODING"]).default("ADAPTIVE"),
  targetLength: z.enum(["SHORT", "STANDARD", "DEEP"]).default("STANDARD"),
});

export const practiceTestPayloadSchema = practiceTestSchema;

export const practiceTestAttemptSchema = z.object({
  practiceTestId: z.string().trim().min(1),
});
