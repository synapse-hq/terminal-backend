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

// using the non-null assertion operator !
const domain:string = process.env.DOMAIN!;
import usersRoutes from "./routes/usersRoutes";
import subDomainRoutes from './routes/subdomain_route';
import bucketsRoutes from "./routes/bucketsRoutes";
import requestsRoutes from "./routes/requestRoutes";

import rootDomainRoutes from "./routes/rootDomainRoutes"

const app: Application = express();
const cors = require('cors');

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

// need to find a way to exclude www from subDomainRoutes (regex?)
// app.use(vhost("www." + domain, rootDomainRoutes));
app.use(vhost(domain, rootDomainRoutes));
app.use(vhost("www." + domain, rootDomainRoutes));
app.use(vhost("*." + domain, subDomainRoutes));


// app.use("/api/buckets", bucketsRoutes)
// app.use("/api/requests", requestsRoutes)
// app.use("/api/users", usersRoutes)

app.use((req: Request, res: Response) => {
  res.send("END OF ROUTES")
});

// below function is for testing

// async function main() {
// }

// main().catch(e => console.error(e.message))
//       .finally(async () => {
//         await pg.$disconnect();
//         await mongo.$disconnect();
//       })

app.listen(port, () => console.log('Server listening on port '+ port));
