import express, { Request, Response, Application, NextFunction } from "express";
import vhost = require('vhost')
import { pg } from './src/db'
import { mongo } from './src/db'
import * as dotenv from "dotenv"
dotenv.config();

//sessions
const session = require("express-session");
const RedisStore = require('connect-redis')(session);
const { createClient } = require('redis')
let redisClient = createClient({ legacyMode: true })
redisClient.connect().catch(console.error);

const port = process.env.PORT;
const domain:string = process.env.DOMAIN!;

import subDomainRoutes from './routes/subdomain_route';
import rootDomainRoutes from "./routes/rootDomainRoutes"

const app: Application = express();
const cors = require('cors');

const fs = require("fs");

app.use(express.json());
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
  store: new RedisStore({client: redisClient }),
}));

console.log(domain)

// sse test route
app.get("/events", async function(req: Request, res: Response) {
  console.log("/events")
  res.set({
    'Cache-Control': 'no-cache',
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive'
  })

  res.flushHeaders()
})

app.use(vhost(domain, rootDomainRoutes));
app.use(vhost("www." + domain, rootDomainRoutes));
app.use(vhost("*." + domain, subDomainRoutes));

app.use((req: Request, res: Response) => {
  	console.log(req.hostname)
	console.log(req.path)
	res.send("END OF ROUTES")
});

app.listen(port, () => console.log('Server listening on port '+ port));
