CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "StudentProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "currentSubjectTopic" TEXT NOT NULL,
  "targetGoal" TEXT NOT NULL,
  "currentSkillLevel" TEXT NOT NULL,
  "deadline" DATETIME,
  "availableStudyTime" TEXT NOT NULL,
  "preferredLearningStyle" TEXT NOT NULL,
  "constraints" TEXT,
  "weakAreas" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Goal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "targetDate" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RoadmapItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "dueDate" DATETIME,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "RoadmapItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Resource" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'ARTICLE',
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Resource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CalendarSync" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'GOOGLE_CALENDAR',
  "googleEmail" TEXT,
  "isConnected" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncedAt" DATETIME,
  "accessTokenExpiresAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CalendarSync_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ProgressEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ProgressEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LearnerContext" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "summary" TEXT,
  "intent" TEXT,
  "readiness" TEXT,
  "confidenceLabel" TEXT,
  "extraNotes" TEXT,
  "normalizedJson" TEXT NOT NULL,
  "missingInfoSummary" TEXT,
  "skillGapsSummary" TEXT,
  "constraintsSummary" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "LearnerContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "FollowUpQuestion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "learnerContextId" TEXT,
  "question" TEXT NOT NULL,
  "rationale" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "answer" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "answeredAt" DATETIME,
  CONSTRAINT "FollowUpQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FollowUpQuestion_learnerContextId_fkey" FOREIGN KEY ("learnerContextId") REFERENCES "LearnerContext" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RoadmapVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "learnerContextId" TEXT,
  "versionNumber" INTEGER NOT NULL,
  "goal" TEXT NOT NULL,
  "summary" TEXT,
  "contentJson" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "source" TEXT NOT NULL DEFAULT 'AGENT_GENERATED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "RoadmapVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RoadmapVersion_learnerContextId_fkey" FOREIGN KEY ("learnerContextId") REFERENCES "LearnerContext" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RoadmapTask" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "roadmapVersionId" TEXT NOT NULL,
  "milestoneTitle" TEXT NOT NULL,
  "milestoneIndex" INTEGER NOT NULL,
  "taskIndex" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "estimatedTime" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "dueWindow" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
  "actualMinutes" INTEGER,
  "completedAt" DATETIME,
  "scheduledStart" DATETIME,
  "scheduledEnd" DATETIME,
  "calendarEventId" TEXT,
  "calendarStatus" TEXT NOT NULL DEFAULT 'NOT_SCHEDULED',
  "syncError" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "RoadmapTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RoadmapTask_roadmapVersionId_fkey" FOREIGN KEY ("roadmapVersionId") REFERENCES "RoadmapVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "TaskResource" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "roadmapTaskId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'ARTICLE',
  "whyRelevant" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SAVED',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TaskResource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TaskResource_roadmapTaskId_fkey" FOREIGN KEY ("roadmapTaskId") REFERENCES "RoadmapTask" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "GoogleCalendarToken" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "accessTokenEncrypted" TEXT,
  "refreshTokenEncrypted" TEXT NOT NULL,
  "primaryCalendarId" TEXT,
  "calendarTimezone" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "GoogleCalendarToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PerformanceSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "roadmapVersionId" TEXT,
  "summary" TEXT NOT NULL,
  "onTrackStatus" TEXT NOT NULL,
  "completionRate" REAL NOT NULL,
  "resourceCompletionRate" REAL NOT NULL,
  "updatedSkillEstimate" TEXT NOT NULL,
  "weakAreasJson" TEXT NOT NULL,
  "suggestionsJson" TEXT NOT NULL,
  "recommendedFocusJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PerformanceSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PerformanceSnapshot_roadmapVersionId_fkey" FOREIGN KEY ("roadmapVersionId") REFERENCES "RoadmapVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PracticeTest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "roadmapVersionId" TEXT,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "focusLabel" TEXT NOT NULL,
  "formatPreference" TEXT NOT NULL,
  "estimatedTotalMinutes" INTEGER NOT NULL,
  "contentJson" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PracticeTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PracticeTest_roadmapVersionId_fkey" FOREIGN KEY ("roadmapVersionId") REFERENCES "RoadmapVersion" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "PracticeTestAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "practiceTestId" TEXT NOT NULL,
  "answersJson" TEXT NOT NULL,
  "resultJson" TEXT NOT NULL,
  "scorePercent" REAL NOT NULL,
  "earnedPoints" REAL NOT NULL,
  "totalPoints" REAL NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "PracticeTestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PracticeTestAttempt_practiceTestId_fkey" FOREIGN KEY ("practiceTestId") REFERENCES "PracticeTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "StudentProfile_userId_key" ON "StudentProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CalendarSync_userId_key" ON "CalendarSync"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "LearnerContext_userId_key" ON "LearnerContext"("userId");
CREATE INDEX IF NOT EXISTS "FollowUpQuestion_userId_status_idx" ON "FollowUpQuestion"("userId", "status");
CREATE INDEX IF NOT EXISTS "RoadmapVersion_userId_isActive_idx" ON "RoadmapVersion"("userId", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "RoadmapTask_roadmapVersionId_milestoneIndex_taskIndex_key" ON "RoadmapTask"("roadmapVersionId", "milestoneIndex", "taskIndex");
CREATE INDEX IF NOT EXISTS "RoadmapTask_userId_status_idx" ON "RoadmapTask"("userId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "GoogleCalendarToken_userId_key" ON "GoogleCalendarToken"("userId");
CREATE INDEX IF NOT EXISTS "TaskResource_roadmapTaskId_status_idx" ON "TaskResource"("roadmapTaskId", "status");
CREATE INDEX IF NOT EXISTS "PerformanceSnapshot_userId_createdAt_idx" ON "PerformanceSnapshot"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PracticeTest_userId_createdAt_idx" ON "PracticeTest"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PracticeTestAttempt_practiceTestId_createdAt_idx" ON "PracticeTestAttempt"("practiceTestId", "createdAt");
