"use client";

import { useActionState } from "react";
import type { StudentProfile } from "@prisma/client";
import { saveProfileAction, type ActionState } from "@/lib/auth/actions";

const initialState: ActionState = {};

type ProfileFormProps = {
  profile: StudentProfile | null;
};

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    saveProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="label" htmlFor="currentSubjectTopic">
          Current subject or topic
        </label>
        <input
          className="field"
          id="currentSubjectTopic"
          name="currentSubjectTopic"
          defaultValue={profile?.currentSubjectTopic ?? ""}
          placeholder="Data Structures, Calculus III, Operating Systems..."
          required
        />
      </div>

      <div className="md:col-span-2">
        <label className="label" htmlFor="targetGoal">
          Target goal
        </label>
        <input
          className="field"
          id="targetGoal"
          name="targetGoal"
          defaultValue={profile?.targetGoal ?? ""}
          placeholder="Score 85%+, crack interviews, finish semester project..."
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="currentSkillLevel">
          Current skill level
        </label>
        <input
          className="field"
          id="currentSkillLevel"
          name="currentSkillLevel"
          defaultValue={profile?.currentSkillLevel ?? ""}
          placeholder="Beginner, intermediate, strong but inconsistent..."
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="deadline">
          Deadline
        </label>
        <input
          className="field"
          id="deadline"
          type="date"
          name="deadline"
          defaultValue={
            profile?.deadline ? profile.deadline.toISOString().slice(0, 10) : ""
          }
        />
      </div>

      <div>
        <label className="label" htmlFor="availableStudyTime">
          Available study time
        </label>
        <input
          className="field"
          id="availableStudyTime"
          name="availableStudyTime"
          defaultValue={profile?.availableStudyTime ?? ""}
          placeholder="2 hours on weekdays, 5 hours on weekends"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="preferredLearningStyle">
          Preferred learning style
        </label>
        <input
          className="field"
          id="preferredLearningStyle"
          name="preferredLearningStyle"
          defaultValue={profile?.preferredLearningStyle ?? ""}
          placeholder="Visual, practice-first, concise explanations..."
          required
        />
      </div>

      <div className="md:col-span-2">
        <label className="label" htmlFor="constraints">
          Constraints
        </label>
        <textarea
          className="field min-h-28"
          id="constraints"
          name="constraints"
          defaultValue={profile?.constraints ?? ""}
          placeholder="Internship hours, club commitments, exam overlap..."
        />
      </div>

      <div className="md:col-span-2">
        <label className="label" htmlFor="weakAreas">
          Weak areas
        </label>
        <textarea
          className="field min-h-28"
          id="weakAreas"
          name="weakAreas"
          defaultValue={profile?.weakAreas ?? ""}
          placeholder="Problem solving speed, proofs, debugging confidence..."
        />
      </div>

      {state.error ? (
        <p className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="md:col-span-2 flex justify-end">
        <button className="btn btn-primary min-w-44" disabled={pending} type="submit">
          {pending ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
  );
}
