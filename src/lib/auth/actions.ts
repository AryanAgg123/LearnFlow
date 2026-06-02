"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  loginSchema,
  profileSchema,
  signupSchema,
  type LoginInput,
  type ProfileInput,
  type SignupInput,
} from "@/lib/auth/validation";
import {
  clearSessionCookie,
  getCurrentSession,
  setSessionCookie,
} from "@/lib/auth/session";

export type ActionState = {
  error?: string;
};

function toText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function normalizeDateInput(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function signupAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    fullName: toText(formData.get("fullName")),
    email: toText(formData.get("email")),
    password: toText(formData.get("password")),
  } satisfies SignupInput);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid signup data." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      passwordHash,
    },
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
  });

  redirect("/profile");
}

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: toText(formData.get("email")),
    password: toText(formData.get("password")),
  } satisfies LoginInput);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login data." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { studentProfile: true },
  });

  if (!user) {
    return { error: "We could not find an account with those details." };
  }

  const matches = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!matches) {
    return { error: "We could not find an account with those details." };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
  });

  redirect(user.studentProfile ? "/dashboard" : "/profile");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}

export async function saveProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const parsed = profileSchema.safeParse({
    currentSubjectTopic: toText(formData.get("currentSubjectTopic")),
    targetGoal: toText(formData.get("targetGoal")),
    currentSkillLevel: toText(formData.get("currentSkillLevel")),
    deadline: toText(formData.get("deadline")),
    availableStudyTime: toText(formData.get("availableStudyTime")),
    preferredLearningStyle: toText(formData.get("preferredLearningStyle")),
    constraints: toText(formData.get("constraints")),
    weakAreas: toText(formData.get("weakAreas")),
  } satisfies ProfileInput);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile data." };
  }

  await prisma.studentProfile.upsert({
    where: { userId: session.userId },
    create: {
      userId: session.userId,
      currentSubjectTopic: parsed.data.currentSubjectTopic,
      targetGoal: parsed.data.targetGoal,
      currentSkillLevel: parsed.data.currentSkillLevel,
      deadline: normalizeDateInput(parsed.data.deadline ?? ""),
      availableStudyTime: parsed.data.availableStudyTime,
      preferredLearningStyle: parsed.data.preferredLearningStyle,
      constraints: parsed.data.constraints || null,
      weakAreas: parsed.data.weakAreas || null,
    },
    update: {
      currentSubjectTopic: parsed.data.currentSubjectTopic,
      targetGoal: parsed.data.targetGoal,
      currentSkillLevel: parsed.data.currentSkillLevel,
      deadline: normalizeDateInput(parsed.data.deadline ?? ""),
      availableStudyTime: parsed.data.availableStudyTime,
      preferredLearningStyle: parsed.data.preferredLearningStyle,
      constraints: parsed.data.constraints || null,
      weakAreas: parsed.data.weakAreas || null,
    },
  });

  redirect("/context");
}
