import { PrismaClient } from "@prisma/client";
import { ACTIVITIES, ALLOWED_USERS } from "../src/lib/constants";

const prisma = new PrismaClient();

async function main() {
  for (const username of ALLOWED_USERS) {
    const user = await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        isAdmin: username === "mario.rossi",
      },
    });

    for (const code of ACTIVITIES) {
      await prisma.activity.upsert({
        where: {
          userId_code: {
            userId: user.id,
            code,
          },
        },
        update: {},
        create: {
          userId: user.id,
          code,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
