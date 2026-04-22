import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:8080"),
});

const rawEnv = envSchema.parse(process.env);

const toList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const env = {
  databaseUrl: rawEnv.DATABASE_URL,
  port: rawEnv.PORT,
  corsOrigins: toList(rawEnv.CORS_ORIGIN),
};
