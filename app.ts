import express, { Request, Response, Application } from "express";
import vhost = require('vhost')
import { pg } from './src/db'
import { mongo } from './src/db'
// import { prisma } from "./src/generated/pg";
import * as dotenv from "dotenv"
dotenv.config();

const port = process.env.PORT;

// using the non-null assertion operator !
const domain:string = process.env.DOMAIN!;
import rootDomainRoutes from './routes/rootdomain_route';
import subDomainRoutes from './routes/subdomain_route';

const app: Application = express();


app.use(vhost(domain, rootDomainRoutes))
    //  .use(vhost('www.' + domain, rootDomainRoutes))
    .use(vhost('localhost', rootDomainRoutes))
    .use(vhost('*.' + domain, subDomainRoutes));

async function main() {
  // const user = await pg.user.create({
  //   data: {
  //     username: 'synapse',
  //     passwordHash: 'asjldfnsdafde',
  //     createdAt: new Date(),
  //   },
  // });

  // console.log(user);

  // const users = await pg.user.findMany();
  // console.log(users);

  const request = {
    body: 'here is the body',
    headers: {
      first: 'firstheader',
      second: 'secondheader',
    },
  };

  await mongo.payload.create({ data: { request } });

}

main().catch(e => console.error(e.message))
      .finally(async () => {
        await pg.$disconnect();
        await mongo.$disconnect();
      })

app.listen(port, () => console.log('Server listening on port '+ port));
