import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultUsers = [
  { username: "mario.rossi", isAdmin: true },
  { username: "giulia.bianchi", isAdmin: false },
  { username: "luca.verdi", isAdmin: false },
  { username: "anna.neri", isAdmin: false },
  { username: "marco.esposito", isAdmin: false },
] as const;

const defaultActivityTemplates = [
  "ATT-1",
  "ATT-2",
  "ATT-3",
  "ATT-4",
  "ATT-5",
  "ATT-6",
  "MEETING",
  "FORMAZIONE",
  "FERIE",
  "PERMESSO",
] as const;

async function main() {
  await prisma.activityTemplate.createMany({
    data: defaultActivityTemplates.map((name) => ({ name })),
    skipDuplicates: true,
  });

  for (const user of defaultUsers) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: { isAdmin: user.isAdmin },
      create: {
        username: user.username,
        isAdmin: user.isAdmin,
      },
    });
  }

  const activityTemplates = await prisma.activityTemplate.findMany({
    orderBy: { name: "asc" },
  });
  const users = await prisma.user.findMany({
    include: {
      activities: true,
    },
  });

  for (const user of users) {
    if (user.activities.length > 0) {
      continue;
    }

    await prisma.activity.createMany({
      data: activityTemplates.map((template) => ({
        userId: user.id,
        name: template.name,
      })),
      skipDuplicates: true,
    });
  }
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
    await prisma.$disconnect();
  })
  .then(async () => {
    await prisma.$disconnect();
  });
