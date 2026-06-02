import crypto from "node:crypto";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/security/secrets";

const GOOGLE_STATE_COOKIE = "pathly_google_oauth_state";
const PATHLY_EVENT_SOURCE = "pathly";

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google Calendar environment variables are not fully configured.");
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function createGoogleOAuthClient() {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export async function createGoogleAuthUrl() {
  const cookieStore = await cookies();
  const state = crypto.randomUUID();
  cookieStore.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });

  const client = createGoogleOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: true,
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    state,
  });

  return url;
}

export async function validateGoogleState(state: string | null) {
  const cookieStore = await cookies();
  const stored = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_STATE_COOKIE);

  return Boolean(state && stored && state === stored);
}

export async function saveGoogleTokensForUser(userId: string, code: string) {
  const client = createGoogleOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token && !tokens.access_token) {
    throw new Error("Google did not return calendar tokens.");
  }

  client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: client });
  const primary = await calendar.calendarList.get({ calendarId: "primary" });

  const existing = await prisma.googleCalendarToken.findUnique({
    where: { userId },
  });

  const refreshToken =
    tokens.refresh_token ??
    (existing ? decryptSecret(existing.refreshTokenEncrypted) : null);

  if (!refreshToken) {
    throw new Error("A refresh token is required for calendar sync.");
  }

  await prisma.googleCalendarToken.upsert({
    where: { userId },
    create: {
      userId,
      accessTokenEncrypted: tokens.access_token
        ? encryptSecret(tokens.access_token)
        : null,
      refreshTokenEncrypted: encryptSecret(refreshToken),
      primaryCalendarId: primary.data.id ?? "primary",
      calendarTimezone: primary.data.timeZone ?? "UTC",
    },
    update: {
      accessTokenEncrypted: tokens.access_token
        ? encryptSecret(tokens.access_token)
        : existing?.accessTokenEncrypted ?? null,
      refreshTokenEncrypted: encryptSecret(refreshToken),
      primaryCalendarId: primary.data.id ?? existing?.primaryCalendarId ?? "primary",
      calendarTimezone: primary.data.timeZone ?? existing?.calendarTimezone ?? "UTC",
    },
  });

  await prisma.calendarSync.upsert({
    where: { userId },
    create: {
      userId,
      isConnected: true,
      lastSyncedAt: null,
      accessTokenExpiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null,
    },
    update: {
      isConnected: true,
      accessTokenExpiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null,
    },
  });
}

export async function disconnectGoogleCalendar(userId: string) {
  await prisma.googleCalendarToken.deleteMany({
    where: { userId },
  });

  await prisma.calendarSync.upsert({
    where: { userId },
    create: {
      userId,
      isConnected: false,
      lastSyncedAt: null,
      accessTokenExpiresAt: null,
    },
    update: {
      isConnected: false,
      lastSyncedAt: null,
      accessTokenExpiresAt: null,
    },
  });
}

export async function getAuthorizedGoogleCalendar(userId: string) {
  const tokenRecord = await prisma.googleCalendarToken.findUnique({
    where: { userId },
  });

  if (!tokenRecord) {
    throw new Error("Google Calendar is not connected.");
  }

  const client = createGoogleOAuthClient();
  client.setCredentials({
    access_token: tokenRecord.accessTokenEncrypted
      ? decryptSecret(tokenRecord.accessTokenEncrypted)
      : undefined,
    refresh_token: decryptSecret(tokenRecord.refreshTokenEncrypted),
  });

  const calendar = google.calendar({ version: "v3", auth: client });

  return {
    calendar,
    calendarId: tokenRecord.primaryCalendarId ?? "primary",
    timezone: tokenRecord.calendarTimezone ?? "UTC",
  };
}

export async function deleteManagedCalendarEvent(
  userId: string,
  eventId: string | null | undefined,
) {
  if (!eventId) {
    return;
  }

  const { calendar, calendarId } = await getAuthorizedGoogleCalendar(userId);

  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: "none",
  });
}

export async function createManagedCalendarEvent(input: {
  userId: string;
  eventId?: string | null;
  taskId: string;
  title: string;
  details: string;
  startIso: string;
  endIso: string;
  timezone: string;
}) {
  const { calendar, calendarId } = await getAuthorizedGoogleCalendar(input.userId);

  const response = await calendar.events.insert({
    calendarId,
    sendUpdates: "none",
    requestBody: {
      summary: input.title,
      description: input.details,
      start: {
        dateTime: input.startIso,
        timeZone: input.timezone,
      },
      end: {
        dateTime: input.endIso,
        timeZone: input.timezone,
      },
      extendedProperties: {
        private: {
          source: PATHLY_EVENT_SOURCE,
          taskId: input.taskId,
        },
      },
    },
  });

  return response.data;
}

export async function markCalendarSyncStatus(input: {
  userId: string;
  isConnected: boolean;
  lastSyncedAt?: Date | null;
  accessTokenExpiresAt?: Date | null;
}) {
  await prisma.calendarSync.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      isConnected: input.isConnected,
      lastSyncedAt: input.lastSyncedAt ?? null,
      accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
    },
    update: {
      isConnected: input.isConnected,
      lastSyncedAt: input.lastSyncedAt ?? null,
      accessTokenExpiresAt: input.accessTokenExpiresAt ?? null,
    },
  });
}
