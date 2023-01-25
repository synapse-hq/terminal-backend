import express, { Request, Response, Application } from "express";



import * as dotenv from "dotenv"
dotenv.config();

const app: Application = express();
const port = process.env.PORT;

app.get('/', (req: Request, res: Response) => {
  res.send('hello')
})

app.listen(port, () => console.log('Server listening on port '+ port));
