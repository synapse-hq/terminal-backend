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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const vhost = require("vhost");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
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
const app = (0, express_1.default)();
// sockets
const http = __importStar(require("http"));
const WebSocket = __importStar(require("ws"));
// sockets
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/api/socket/buckets" });
// msg queue
const amqp = require("amqplib/callback_api");
// when connection established
wss.on('connection', (ws) => {
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
                    exclusive: false
                }, function (error2, q) {
                    if (error2) {
                        throw error2;
                    }
                    channel.assertQueue(subdomain, {
                        durable: true
                    });
                    console.log(" [*] Waiting for messages in %s", q);
                    channel.prefetch(100);
                    console.log("BOUND to queue");
                    channel.consume(q.queue, function (msg) {
                        if (msg.content) {
                            console.log("ABOUT TO SEND MSG", JSON.parse(msg.content.toString()));
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
        console.log("ws connection closed");
    });
    // initial connection acknowledgement on client and server side
    console.log("websocket connection established");
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
app.use(vhost(domain, rootDomainRoutes_1.default));
app.use(vhost("www." + domain, rootDomainRoutes_1.default));
app.use(vhost("*." + domain, subdomain_route_1.default));
app.use((req, res) => {
    res.send("END OF ROUTES");
});
server.listen(port, () => console.log('Server listening on port ' + port));
//# sourceMappingURL=app.js.map