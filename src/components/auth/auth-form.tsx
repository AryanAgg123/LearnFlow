"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ActionState } from "@/lib/auth/actions";

const initialState: ActionState = {};

type AuthFormProps = {
  mode: "login" | "signup";
  action: (
    previousState: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="space-y-5">
      {isSignup ? (
        <div>
          <label className="label" htmlFor="fullName">
            Full name
          </label>
          <input
            className="field"
            id="fullName"
            name="fullName"
            placeholder="Aarav Sharma"
            required
          />
        </div>
      ) : null}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="field"
          id="email"
          type="email"
          name="email"
          placeholder="you@college.edu"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          className="field"
          id="password"
          type="password"
          name="password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending
          ? "Please wait..."
          : isSignup
            ? "Create account"
            : "Sign in"}
      </button>

      <p className="text-sm text-[var(--muted)]">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link
          className="font-semibold text-[var(--brand-strong)]"
          href={isSignup ? "/login" : "/signup"}
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
