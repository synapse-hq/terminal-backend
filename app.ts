// @ts-nocheck

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

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));


app.set('trust proxy', 1)
app.use(session({
  cookie: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    sameSite: 'none',
  },
  proxy: true,  
  name: 'terminal-cookie',
  // resave: true,
  // saveUninitialized: true,
  secret: "secret",
  store: new RedisStore({client: redisClient }),
}));

console.log(domain)

app.use(vhost(domain, rootDomainRoutes));
app.use(vhost("www." + domain, rootDomainRoutes));
app.use(vhost("*." + domain, subDomainRoutes));

app.use((req: Request, res: Response) => {
  res.send("END OF ROUTES")
});

app.listen(port, () => console.log('Server listening on port '+ port));
