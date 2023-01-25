import express, { Request, Response, Application } from "express";
import * as dotenv from "dotenv"
dotenv.config();

import { pg } from './src/db'
import { mongo } from './src/db'

const app: Application = express();
const port = process.env.PORT;

// async function main() {
//   const user = await pg.user.create({
//     data: {
//       username: 'synapse',
//       passwordHash: 'asjldfnsdafde',
//       createdAt: new Date(),
//     },
//   });

//   console.log(user);
// }

// main().catch(e => console.error(e.message))
//       .finally(async () => {
//         await pg.$disconnect();
//         await mongo.$disconnect();
//       })

app.get('/', (req: Request, res: Response) => {
  res.send('hello')
})

app.listen(port, () => console.log('Server listening on port '+ port));
