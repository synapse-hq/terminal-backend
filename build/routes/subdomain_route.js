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
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const db_1 = require("../src/db");
const db_2 = require("../src/db");
const amqp = require("amqplib/callback_api");
router.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // find bucket based on current subdomain (prepended part)
    const subdomain = req.hostname.split('.')[0];
    const bucket = yield db_1.pg.bucket.findFirst({
        where: {
            subdomain: subdomain,
        }
    });
    if (!bucket) {
        res.status(404).send("No such bucket found");
        return;
    }
    const payload = yield db_2.mongo.payload.create({
        data: {
            rawRequest: {
                headers: req.headers,
                body: req.body,
            }
        }
    });
    // PAYLOAD = {rawRequest: {headers, body}}
    // always returns empty string ??
    let clientIp;
    const ipHeader = req.headers["x-forwarded-for"];
    if (!ipHeader) {
        clientIp = "";
    }
    else {
        clientIp = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader;
    }
    const obj = yield db_1.pg.request.create({
        data: {
            bucketId: bucket.id,
            createdAt: new Date(),
            method: req.method,
            path: req.path,
            query: req.query,
            payload: payload.id,
            clientIp,
        },
    });
    // create new obj to send
    const requestToEmit = Object.assign(Object.assign({}, obj), { rawRequest: payload });
    // creating a channel with amqp msg q
    amqp.connect('amqp://diego:password@localhost/RabbitsInParis', function (error0, connection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (error0) {
                throw error0;
            }
            // create the exchange and msg queu
            connection.createChannel(function (error1, channel) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (error1) {
                        throw error1;
                    }
                    channel.assertQueue(subdomain, {
                        durable: true
                    });
                    channel.sendToQueue(subdomain, Buffer.from(JSON.stringify(requestToEmit)), {
                        persistent: true
                    });
                });
            });
            setTimeout(() => {
                connection.close();
            }, 2500);
        });
    });
    res.status(200).send("request received");
}));
exports.default = router;
//# sourceMappingURL=subdomain_route.js.map