"use strict";
// @ts-nocheck
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../src/db");
const router = express_1.default.Router();
// import { mongo } from "../src/db"
function uuid() {
    let time = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        time += performance.now();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let random = (time + Math.random() * 16) % 16 | 0;
        time = Math.floor(time / 16);
        return (c === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
    });
}
// get all active user buckets
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.user) {
        ///
        try {
            const buckets = yield db_1.pg.bucket.findMany({
                where: {
                    userId: req.session.user.id,
                    deleted: false
                }
            });
            res.status(200).json(buckets);
        }
        catch (_a) {
            res.status(400).json({ error: "invalid user" });
        }
        ///
    }
    else {
        res.status(400).json({ error: "Not Logged In" });
    }
}));
// make a new bucket
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const { user } = req.session;
    if (!user) {
        res.status(404).json({ error: "invalid user" });
        return;
    }
    const subdomain = user.username + uuid();
    const existingBucket = yield db_1.pg.bucket.findFirst({
        where: {
            subdomain,
        }
    });
    if (existingBucket) {
        res.status(404).json({ error: "UUID has failed to provide a UUID, please try again" });
        return;
    }
    try {
        const newBucket = yield db_1.pg.bucket.create({
            data: {
                userId: user.id,
                subdomain,
                deleted: false,
                createdAt: new Date()
            }
        });
        console.log(newBucket);
        res.status(200).json(newBucket);
    }
    catch (_b) {
        res.status(404).json({ error: "invalid user" });
    }
}));
router.post("/share", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("SHARING ATTEMPT", req.body);
    if (req.session.user) {
        const body = req.body;
        const { shareUser, shareBucket } = body;
        const user = yield db_1.pg.user.findUnique({
            where: {
                username: shareUser,
            },
        });
        if (user.id === req.session.user.id) {
            res.status(400).json({ error: "You are the owner of this bucket" });
        }
        if (!user) {
            res.status(404).json({ error: "User does not exists" });
            return;
        }
        console.log("USER id", user.id);
        const bucket = yield db_1.pg.bucket.findFirst({
            where: {
                userId: user.id,
                subdomain: shareBucket,
                deleted: false,
            }
        });
        console.log("TO SHARE", bucket);
        if (bucket) {
            res.status(200).json(bucket);
        }
        const bucketOwner = yield db_1.pg.bucket.findFirst({
            where: {
                userId: req.session.user.id,
                subdomain: shareBucket,
                deleted: false,
                owner: true,
            }
        });
        if (!bucketOwner) {
            res.status(401).json({ error: "You are not the owner of this bucket" });
            return;
        }
        try {
            const sharedBucket = yield db_1.pg.bucket.create({
                data: {
                    userId: user.id,
                    subdomain: shareBucket,
                    deleted: false,
                    createdAt: bucketOwner.createdAt,
                    sharedAt: new Date(),
                    owner: false,
                    mainBucketId: bucketOwner.id,
                }
            });
            res.status(200).json(sharedBucket);
            return;
        }
        catch (error) {
            res.status(500).json({ error: "Something went wrong" });
        }
    }
    else {
        res.status(401).json({ error: "Must be logged in, possible session timeout" });
    }
}));
// set a bucket to deleted
router.delete("/:subdomain", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { subdomain } = req.params;
    if (req.session.user) {
        console.log("DELETE", subdomain);
        try {
            const updated = yield db_1.pg.bucket.update({
                where: {
                    subdomain,
                    userid: req.session.user.id
                },
                data: {
                    deleted: true
                }
            });
            res.status(200).json({ updated });
        }
        catch (_c) {
            res.status(400).json({ error: "bucket does not exists" });
        }
    }
}));
exports.default = router;
//# sourceMappingURL=bucketsRoutes.js.map