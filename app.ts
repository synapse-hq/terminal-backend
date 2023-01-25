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
const cors = require('cors');

app.use(express.json());
app.use(cors());
app.use(express.static('build'));


app.use(vhost(domain, rootDomainRoutes))
    //  .use(vhost('www.' + domain, rootDomainRoutes))
    // ngrok url used below for testing
    .use(vhost("dcbb-108-243-22-76.ngrok.io", subDomainRoutes));

async function main() {

  // const users = await pg.user.findMany();
  // console.log(users)

  // const buckets = await pg.bucket.findMany();
  // console.log(buckets)

  // await pg.bucket.create({
  //   data: {
  //     userId: 1,
  //     deleted: false,
  //     subdomain: "6d3a-108-243-22-76",
  //     createdAt: new Date(),
  //   }
  // })
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

  // const request = {
  //   body: 'dego test',
  //   headers: {
  //     first: 'firstheader',
  //     second: 'secondheader',
  //   },
  // };

  // await mongo.payload.create({ data: { request } });

}

main().catch(e => console.error(e.message))
      .finally(async () => {
        await pg.$disconnect();
        await mongo.$disconnect();
      })

app.listen(port, () => console.log('Server listening on port '+ port));
