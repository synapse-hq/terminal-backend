"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const vhost = require("vhost");
const db_1 = require("./src/db");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const url_1 = __importDefault(require("url"));
const port = process.env.PORT;
const domain = process.env.DOMAIN;
const subdomain_route_1 = __importDefault(require("./routes/subdomain_route"));
const rootDomainRoutes_1 = __importDefault(require("./routes/rootDomainRoutes"));
//sessions
const session = require("express-session");
const RedisStore = require('connect-redis')(session);
const { createClient } = require('redis');
let redisClient = createClient({ legacyMode: true });
redisClient.connect().catch(console.error);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = (0, express_1.default)();
// app.use(cookieParser())
// sockets
const http = __importStar(require("http"));
const WebSocket = __importStar(require("ws"));
// sockets
const server = http.createServer(app);
// const wss = new WebSocket.Server({server, path: "/api/socket/buckets"})
const bucketWS = new WebSocket.Server({ noServer: true });
const userSearchWS = new WebSocket.Server({ noServer: true });
const userSearchInactiveTimeout = 30000;
// msg queue
const amqp = require("amqplib/callback_api");
// Bucket websocket connection
bucketWS.on('connection', (ws) => {
    //function executed when websocket on server receives a message
    ws.on('message', (subdomain) => {
        subdomain = subdomain.toString();
        //log the received message
        console.log('bucket subdomain: %s', subdomain);
        // creating a channel with amqp msg q
        amqp.connect("amqp://diego:password@localhost/RabbitsInParis", function (error0, connection) {
            if (error0) {
                console.log(error0);
                throw error0;
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    throw error1;
                }
                // create a queueu that will consume from the newly created queue
                channel.assertQueue(subdomain, {
                    durable: false,
                    exclusive: false
                }, function (error2, q) {
                    if (error2) {
                        throw error2;
                    }
                    channel.prefetch(100);
                    channel.consume(q.queue, function (msg) {
                        if (msg.content) {
                            ws.send(msg.content.toString());
                        }
                    }, {
                        noAck: true
                    });
                });
            });
            //immediately after subscribe to the created qmsg broker /
        });
    });
    ws.on("close", () => {
        console.log("Bucket ws connection closed");
    });
    // initial connection acknowledgement on client and server side
    console.log("Bucket websocket connection established");
});
userSearchWS.on('connection', (ws, req) => {
    const closeWS = () => setTimeout(() => ws.close(), userSearchInactiveTimeout);
    let closeTimer = closeWS();
    ws.on('message', (searchBlob) => __awaiter(void 0, void 0, void 0, function* () {
        clearTimeout(closeTimer);
        const search = searchBlob.toString();
        const matches = yield db_1.pg.user.findMany({
            take: 7,
            where: {
                username: {
                    startsWith: search
                },
            },
            orderBy: {
                username: 'asc'
            },
        });
        yield ws.send(JSON.stringify(matches));
        closeTimer = closeWS();
    }));
    ws.on('close', () => {
        console.log('User search WS closed');
    });
    console.log("User Search websocket connection established");
});
// handle client WebSocket connection initialization
server.on('upgrade', (req, socket, head) => {
    const path = url_1.default.parse(req.url).pathname;
    // WS routes
    if (path === "/api/socket/buckets") {
        bucketWS.handleUpgrade(req, socket, head, (ws) => {
            bucketWS.emit('connection', ws, req);
        });
    }
    else if (path === "/api/socket/user-search") {
        userSearchWS.handleUpgrade(req, socket, head, (ws) => {
            userSearchWS.emit('connection', ws, req);
        });
    }
    else {
        socket.destroy();
    }
});
//
const cors = require('cors');
app.use(express_1.default.json());
app.use(cors());
app.use(session({
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
        secure: false,
    },
    name: 'session-example',
    resave: false,
    saveUninitialized: true,
    secret: "secret",
    store: new RedisStore({ client: redisClient }),
}));
app.use(cookieParser());
app.use(bodyParser());
app.use(vhost(domain, rootDomainRoutes_1.default));
app.use(vhost("www." + domain, rootDomainRoutes_1.default));
app.use(vhost("*." + domain, subdomain_route_1.default));
app.use((req, res) => {
    res.send("END OF ROUTES");
});
server.listen(port, () => console.log('Server listening on port ' + port));
//# sourceMappingURL=app.js.map