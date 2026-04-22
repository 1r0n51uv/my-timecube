import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

interface TimeEntryPayload {
  id: string;
  date: string;
  activity: string;
  hours: number;
  notes: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function getUserResourceRoute(pathname: string) {
  const match = pathname.match(/\/users\/([^/]+)\/(profile|timesheets|activities)$/);
  if (!match) return null;

  return {
    username: decodeURIComponent(match[1]),
    resource: match[2],
  };
}

function validateEntries(value: unknown): value is TimeEntryPayload[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => {
      if (!entry || typeof entry !== "object") return false;

      const record = entry as Record<string, unknown>;
      return (
        typeof record.id === "string" &&
        typeof record.date === "string" &&
        typeof record.activity === "string" &&
        typeof record.hours === "number" &&
        typeof record.notes === "string"
      );
    })
  );
}

async function getUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

async function handleUsers(req: Request) {
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const users = await prisma.user.findMany({
    select: {
      username: true,
      isAdmin: true,
    },
    orderBy: {
      username: "asc",
    },
  });

  return json({ users });
}

async function handleProfile(username: string, req: Request) {
  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const user = await getUserByUsername(username);
  if (!user) {
    return json({ error: "User not authorized" }, 403);
  }

  return json({
    username: user.username,
    isAdmin: user.isAdmin,
  });
}

async function handleActivities(username: string, req: Request) {
  const user = await getUserByUsername(username);
  if (!user) {
    return json({ error: "User not authorized" }, 403);
  }

  if (req.method === "GET") {
    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { code: "asc" },
    });

    return json({ activities: activities.map((activity) => activity.code) });
  }

  if (req.method === "PUT") {
    const body = (await req.json()) as { activities?: unknown };
    if (!Array.isArray(body.activities) || body.activities.some((activity) => typeof activity !== "string")) {
      return json({ error: "Invalid activities payload" }, 400);
    }

    await prisma.$transaction([
      prisma.activity.deleteMany({
        where: { userId: user.id },
      }),
      prisma.activity.createMany({
        data: body.activities.map((code) => ({
          userId: user.id,
          code,
        })),
      }),
    ]);

    return json({ activities: body.activities });
  }

  return json({ error: "Method not allowed" }, 405);
}

async function handleTimesheets(username: string, req: Request, url: URL) {
  const user = await getUserByUsername(username);
  if (!user) {
    return json({ error: "User not authorized" }, 403);
  }

  const year = Number(url.searchParams.get("year"));
  const month = Number(url.searchParams.get("month"));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return json({ error: "Invalid year or month" }, 400);
  }

  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));

  if (req.method === "GET") {
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        date: {
          gte: from,
          lt: to,
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    return json({
      entries: entries.map((entry) => ({
        id: entry.id,
        date: entry.date.toISOString().slice(0, 10),
        activity: entry.activity,
        hours: Number(entry.hours),
        notes: entry.notes,
      })),
    });
  }

  if (req.method === "PUT") {
    const body = (await req.json()) as { entries?: unknown };
    if (!validateEntries(body.entries)) {
      return json({ error: "Invalid entries payload" }, 400);
    }

    await prisma.$transaction([
      prisma.timeEntry.deleteMany({
        where: {
          userId: user.id,
          date: {
            gte: from,
            lt: to,
          },
        },
      }),
      prisma.timeEntry.createMany({
        data: body.entries.map((entry) => ({
          id: entry.id,
          userId: user.id,
          date: new Date(`${entry.date}T00:00:00.000Z`),
          activity: entry.activity,
          hours: entry.hours,
          notes: entry.notes,
        })),
      }),
    ]);

    return json({ entries: body.entries });
  }

  return json({ error: "Method not allowed" }, 405);
}

export async function handleApiRequest(req: Request) {
  const url = new URL(req.url);

  if (url.pathname.endsWith("/health")) {
    return json({ status: "ok" });
  }

  if (url.pathname.endsWith("/users")) {
    return handleUsers(req);
  }

  const route = getUserResourceRoute(url.pathname);
  if (!route) {
    return json({ error: "Unknown endpoint" }, 404);
  }

  if (route.resource === "profile") {
    return handleProfile(route.username, req);
  }

  if (route.resource === "activities") {
    return handleActivities(route.username, req);
  }

  return handleTimesheets(route.username, req, url);
}
