import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { env } from "./env.js";
import { prisma } from "./prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  }),
);
app.use(express.json());

const monthQuerySchema = z.object({
  year: z.coerce.number().int().min(2000),
  month: z.coerce.number().int().min(1).max(12),
});

const dateRangeQuerySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .transform(({ from, to }) => {
    const [lo, hi] = from <= to ? [from, to] : [to, from];
    return {
      from: lo,
      to: hi,
    };
  });

const usernameSchema = z.object({
  username: z.string().min(1),
});

const createUserSchema = z.object({
  username: z.string().trim().min(1),
  isAdmin: z.boolean().default(false),
});

const timeEntrySchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activity: z.string().min(1),
  hours: z.number().min(0).max(24),
  notes: z.string(),
});

const replaceEntriesSchema = z.object({
  entries: z.array(timeEntrySchema),
});

const activitiesSchema = z.object({
  activities: z.array(z.string().min(1)).transform((items) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    });
  }),
});

function monthRange(year: number, month: number) {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 1));
  return { from, to };
}

function inclusiveDateRange(from: string, to: string) {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  return { from: start, to: end };
}

async function getDefaultActivityNames() {
  const templates = await prisma.activityTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return templates.map((template) => template.name);
}

async function getAppConfigResponse() {
  const [users, defaultActivities] = await Promise.all([
    prisma.user.findMany({
      orderBy: { username: "asc" },
      select: {
        username: true,
        isAdmin: true,
      },
    }),
    getDefaultActivityNames(),
  ]);

  return {
    allowedUsers: users.map((user) => user.username),
    adminUsers: users.filter((user) => user.isAdmin).map((user) => user.username),
    defaultActivities,
  };
}

async function ensureUser(username: string) {
  let user = await prisma.user.findUnique({
    where: { username },
    include: {
      activities: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!user) {
    throw new Error(`Unknown user: ${username}`);
  }

  const defaultActivities = await getDefaultActivityNames();
  if (user.activities.length === 0 && defaultActivities.length > 0) {
    const userId = user.id;
    await prisma.activity.createMany({
      data: defaultActivities.map((name) => ({
        name,
        userId,
      })),
      skipDuplicates: true,
    });

    user = await prisma.user.findUniqueOrThrow({
      where: { username },
      include: {
        activities: {
          orderBy: { name: "asc" },
        },
      },
    });
  }

  return user;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/openapi.json", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "../openapi.json"));
});

app.get("/api/config", async (_req, res, next) => {
  try {
    const configResponse = await getAppConfigResponse();
    res.json(configResponse);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/users", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { username: "asc" },
      select: {
        username: true,
        isAdmin: true,
      },
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users", async (req, res, next) => {
  try {
    const { username, isAdmin } = createUserSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new Error(`User ${username} already exists`);
    }

    const user = await prisma.user.create({
      data: {
        username,
        isAdmin,
      },
    });

    const defaultActivities = await getDefaultActivityNames();
    if (defaultActivities.length > 0) {
      await prisma.activity.createMany({
        data: defaultActivities.map((name) => ({
          name,
          userId: user.id,
        })),
        skipDuplicates: true,
      });
    }

    res.status(201).json({
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/users/:username", async (req, res, next) => {
  try {
    const { username } = usernameSchema.parse(req.params);
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        isAdmin: true,
      },
    });

    if (!user) {
      throw new Error(`Unknown user: ${username}`);
    }

    if (user.isAdmin) {
      const adminCount = await prisma.user.count({
        where: { isAdmin: true },
      });

      if (adminCount <= 1) {
        throw new Error("Cannot remove the last admin user");
      }
    }

    await prisma.user.delete({
      where: { id: user.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:username/activities", async (req, res, next) => {
  try {
    const { username } = usernameSchema.parse(req.params);
    const user = await ensureUser(username);
    res.json({
      activities: user.activities.map((activity) => activity.name),
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:username/activities", async (req, res, next) => {
  try {
    const { username } = usernameSchema.parse(req.params);
    const { activities } = activitiesSchema.parse(req.body);
    const user = await ensureUser(username);

    await prisma.$transaction([
      prisma.activity.deleteMany({ where: { userId: user.id } }),
      ...(activities.length > 0
        ? [
            prisma.activity.createMany({
              data: activities.map((name) => ({
                name,
                userId: user.id,
              })),
            }),
          ]
        : []),
    ]);

    res.json({ activities });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:username/entries", async (req, res, next) => {
  try {
    const { username } = usernameSchema.parse(req.params);
    const { year, month } = monthQuerySchema.parse(req.query);
    const user = await ensureUser(username);
    const { from, to } = monthRange(year, month);

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

    res.json({
      entries: entries.map((entry) => ({
        id: entry.id,
        date: entry.date.toISOString().slice(0, 10),
        activity: entry.activity,
        hours: entry.hours,
        notes: entry.notes,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:username/entries-range", async (req, res, next) => {
  try {
    const { username } = usernameSchema.parse(req.params);
    const { from, to } = dateRangeQuerySchema.parse(req.query);
    const user = await ensureUser(username);
    const range = inclusiveDateRange(from, to);

    const entries = await prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        date: {
          gte: range.from,
          lt: range.to,
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    res.json({
      entries: entries.map((entry) => ({
        id: entry.id,
        date: entry.date.toISOString().slice(0, 10),
        activity: entry.activity,
        hours: entry.hours,
        notes: entry.notes,
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:username/entries", async (req, res, next) => {
  try {
    const { username } = usernameSchema.parse(req.params);
    const { year, month } = monthQuerySchema.parse(req.query);
    const { entries } = replaceEntriesSchema.parse(req.body);
    const user = await ensureUser(username);
    const { from, to } = monthRange(year, month);

    for (const entry of entries) {
      const expectedMonth = `${year}-${String(month).padStart(2, "0")}`;
      if (entry.date.slice(0, 7) !== expectedMonth) {
        throw new Error(`Entry ${entry.id} is outside of ${expectedMonth}`);
      }
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
      ...(entries.length > 0
        ? [
            prisma.timeEntry.createMany({
              data: entries.map((entry) => ({
                id: entry.id,
                userId: user.id,
                date: new Date(`${entry.date}T00:00:00.000Z`),
                activity: entry.activity,
                hours: entry.hours,
                notes: entry.notes,
              })),
            }),
          ]
        : []),
    ]);

    res.json({ entries });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/monthly-summary", async (req, res, next) => {
  try {
    const { year, month } = monthQuerySchema.parse(req.query);
    const { from, to } = monthRange(year, month);
    const users = await prisma.user.findMany({
      orderBy: { username: "asc" },
      select: {
        username: true,
        id: true,
      },
    });

    const summaries = await Promise.all(
      users.map(async (user) => {
        const aggregate = await prisma.timeEntry.aggregate({
          where: {
            userId: user.id,
            date: {
              gte: from,
              lt: to,
            },
          },
          _sum: {
            hours: true,
          },
        });

        return {
          user: user.username,
          hours: aggregate._sum.hours ?? 0,
        };
      }),
    );

    res.json({ summaries });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({
      message: "Validation failed",
      issues: error.flatten(),
    });
    return;
  }

  if (error instanceof Error && error.message.startsWith("Unknown user:")) {
    res.status(404).json({ message: error.message });
    return;
  }

  if (error instanceof Error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(500).json({ message: "Unexpected server error" });
});

app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port}`);
});
