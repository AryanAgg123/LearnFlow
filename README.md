# Pathly

Pathly is a lean student personalization platform built for a 3rd-year college student who wants clarity, speed, and practical guidance. The app uses a small Next.js + Prisma backend, OpenAI Agents SDK for orchestration, the OpenAI Responses stack for model and tool calls, and Google Calendar only for scheduling.

It currently includes:

- Phase 1: landing page, auth, dashboard shell, and student profile intake
- Phase 2: student information gathering agent and learner-context normalization
- Phase 3: personalized roadmap generation with editable, versioned roadmaps
- Phase 4: resource curation and Google Calendar scheduling
- Phase 5: progress tracking, performance insights, and dashboard analytics
- Practice tests: adaptive quizzes and coding assessments generated from current progress
- Practice test attempts: answer inside the app, get AI evaluation, and see a final score

## Product flow

1. Sign up and complete the student profile
2. Run the learner-context agent on `/context`
3. Answer one focused follow-up question if needed
4. Generate a roadmap on `/roadmap`
5. Curate resources for roadmap tasks
6. Connect Google Calendar and sync study blocks
7. Track task and resource completion
8. Refresh performance insights and regenerate roadmaps when needed
9. Generate adaptive practice tests from current focus and progress
10. Submit answers in-app and get scored feedback with strengths, weak areas, and next steps

## Architecture

```text
src/
  app/
    api/google/connect/route.ts
    api/google/callback/route.ts
    page.tsx
    login/page.tsx
    signup/page.tsx
    profile/page.tsx
    dashboard/page.tsx
    practice-tests/page.tsx
    context/page.tsx
    roadmap/page.tsx
  components/
    auth/auth-form.tsx
    calendar/google-calendar-card.tsx
    context/context-workspace.tsx
    context/learner-context-preview.tsx
    dashboard/progress-overview.tsx
    practice-tests/practice-test-generator.tsx
    practice-tests/practice-test-viewer.tsx
    profile/profile-form.tsx
    roadmap/planning-actions-panel.tsx
    roadmap/roadmap-editor.tsx
    roadmap/roadmap-generator.tsx
    roadmap/task-board.tsx
    shell/dashboard-shell.tsx
  lib/
    agents/
      assessment.ts
      base-agent.ts
      performance.ts
      resource.ts
      roadmap.ts
      scheduler.ts
      schemas.ts
      student-info.ts
      registry.ts
    auth/
      actions.ts
      session.ts
      validation.ts
    google/
      calendar.ts
    planning/
      actions.ts
      helpers.ts
      performance.ts
      task-sync.ts
      validation.ts
    security/
      secrets.ts
    openai/
      client.ts
    prisma.ts
    proxy.ts
prisma/
  schema.prisma
  init.sql
scripts/
  init-db.mjs
```

## Agent system

### Student info agent

- Reads the saved student profile plus extra notes
- Uses the LLM to decide whether one more follow-up question is actually needed
- Normalizes messy input into a structured learner context
- Infers intent, skill gaps, constraints, and confidence
- Saves the learner context for downstream agents

### Roadmap curation agent

- Reads the normalized learner context
- Generates a personalized roadmap with milestones and tasks
- Keeps the schema simple and user-editable
- Saves version history so the roadmap can be regenerated later

### Resource finding agent

- Curates a small set of high-signal resources for roadmap tasks
- Uses OpenAI hosted search tooling instead of a custom scraper
- Stores why each resource is relevant
- Attaches resources directly to roadmap tasks

### Calendar scheduling agent

- Converts roadmap tasks into realistic study blocks
- Uses Google Calendar only for scheduling and sync
- Recreates managed events to keep the schedule aligned with the current roadmap state
- Stores sync state, event IDs, and sync errors per task

### Performance tracking agent

- Tracks task and resource completion
- Compares execution against the active roadmap
- Produces simple insight snapshots for pacing, weak areas, and suggested refinements
- Supports lightweight roadmap refresh workflows without a large rule engine

### Practice test agent

- Generates compact assessments from learner context, roadmap tasks, and recent performance
- Can produce quizzes, short-answer prompts, and coding questions
- Adapts the mix based on current progress and focus area instead of fixed backend rules
- Saves generated tests so students can revisit previous practice sets
- Supports scored attempts with AI evaluation and question-level feedback

## Data model

The database is intentionally small and centered on the planning loop:

- `User`
- `StudentProfile`
- `LearnerContext`
- `FollowUpQuestion`
- `RoadmapVersion`
- `RoadmapTask`
- `TaskResource`
- `GoogleCalendarToken`
- `CalendarSync`
- `PerformanceSnapshot`
- `PracticeTest`
- `PracticeTestAttempt`

The source of truth for roadmap editing stays versioned in `RoadmapVersion.contentJson`, while `RoadmapTask`, `TaskResource`, and `PracticeTest` provide app-friendly records for execution, assessment, scheduling, and analytics.

## Environment variables

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`
- `AUTH_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_AGENT_MODEL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

Notes:

- Use a real `OPENAI_API_KEY` for `/context` and `/roadmap`
- The default agent model is `gpt-5-mini`, which is the lowest-cost sensible default here for multi-step student-planning tasks
- The resource agent defaults to `gpt-5.4-nano` because `toolSearchTool()` requires a GPT-5.4-or-newer Responses model, and this is the cheapest compatible option
- You can override individual agent models with `OPENAI_STUDENT_AGENT_MODEL`, `OPENAI_RESOURCE_AGENT_MODEL`, and `OPENAI_PLANNING_AGENT_MODEL`
- Google OAuth is only used for calendar connection and scheduling
- Do not hardcode any secrets in the codebase

## Run locally

```bash
npm install
npm run db:init
npx prisma generate
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run db:init
npm run lint
npm run build
```

## Current UX surfaces

- `/` landing page
- `/signup` and `/login` auth flow
- `/profile` student profile intake
- `/context` learner-context agent workspace
- `/practice-tests` adaptive test generation and history
- `/practice-tests` also supports answer submission, AI evaluation, and final scoring
- `/roadmap` roadmap generation, editing, resources, calendar sync, and task tracking
- `/dashboard` progress overview and execution snapshot

## Implementation notes

- The app keeps logic mostly agent-driven instead of using large backend branching trees
- Resource ranking is LLM-led with OpenAI hosted search tools
- Scheduling stays intentionally simple and understandable
- The codebase is prepared for future multi-agent additions without rewriting auth, profile, or roadmap flows
- Google services are not used outside calendar sync
