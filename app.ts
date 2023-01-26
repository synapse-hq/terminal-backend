import express, { Request, Response, Application } from "express";
import vhost = require('vhost')
import { pg } from './src/db'
import { mongo } from './src/db'
import * as dotenv from "dotenv"

dotenv.config();

const port = process.env.PORT;

// using the non-null assertion operator !
const domain:string = process.env.DOMAIN!;
import usersRoutes from "./routes/usersRoutes";
import subDomainRoutes from './routes/subdomain_route';
import binsRoutes from "./routes/binsRoutes";
import requestsRoutes from "./routes/requestRoutes";

const app: Application = express();
const cors = require('cors');

app.use(express.json());
app.use(cors());
app.use(express.static('build'));

console.log(domain)

// need to find a way to exclude www from subDomainRoutes (regex?)
app.use(vhost("*." + domain, subDomainRoutes));

app.use("/api/bins", binsRoutes)
app.use("/api/requests", requestsRoutes)
app.use("/api/users", usersRoutes)

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
