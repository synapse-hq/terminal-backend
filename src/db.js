"use strict";
exports.__esModule = true;
exports.mongo = exports.pg = void 0;
var pg_1 = require("./generated/pg");
var mongo_1 = require("./generated/mongo");
exports.pg = new pg_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.PG_DATABASE_URL
        }
    }
});
exports.mongo = new mongo_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.MONGODB_DATABASE_URL
        }
    }
});
