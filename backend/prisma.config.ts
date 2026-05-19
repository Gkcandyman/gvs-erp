import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    provider: "postgresql", // change this if you're using mysql/sqlite/etc.
    url: process.env.DATABASE_URL,
  },
});