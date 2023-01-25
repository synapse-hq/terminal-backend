import { PrismaClient as PG } from "./generated/pg";
import { PrismaClient as Mongo } from "./generated/mongo";

export const pg = new PG({
  datasources: {
    db: {
      url: process.env.PG_DATABASE_URL,
    },
  },
});

export const mongo = new Mongo({
  datasources: {
    db: {
      url: process.env.MONGODB_DATABASE_URL,
    },
  },
});