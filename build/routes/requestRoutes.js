"use strict";
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
// @ts-nocheck
const express_1 = __importDefault(require("express"));
const db_1 = require("../src/db");
const db_2 = require("../src/db");
const router = express_1.default.Router();
router.get("/:subdomain", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.session.user) {
        const bucket = yield db_1.pg.bucket.findFirst({
            where: {
                subdomain: req.params.subdomain,
                userId: req.session.user.id
            }
        });
        if (!bucket) {
            res.status(404).json({ error: "bucket does not exists or you do not have access" });
            return;
        }
        const bucketId = bucket.owner ? bucket.id : bucket.mainBucketId;
        let requests = yield db_1.pg.request.findMany({
            where: {
                bucketId,
            }
        });
        try {
            let promises = requests.map((request) => __awaiter(void 0, void 0, void 0, function* () {
                const payload = yield db_2.mongo.payload.findUnique({
                    where: {
                        id: request.payload
                    }
                });
                return Object.assign(Object.assign({}, request), { rawRequest: payload.rawRequest });
            }));
            console.log(promises);
            requests = yield Promise.all(promises);
            console.log("REQS", requests);
            res.status(200).json(requests);
        }
        catch (err) {
            res.status(404).json({ error: "failed mongodb queries....." });
        }
    }
    else {
        res.status(401).json({ error: "You are not logged in" });
    }
}));
exports.default = router;
//# sourceMappingURL=requestRoutes.js.map