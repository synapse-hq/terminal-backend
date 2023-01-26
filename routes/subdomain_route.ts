import express, { Request, Response, Router } from 'express';
const router:Router = express.Router();
import { pg } from '../src/db'
import { mongo } from '../src/db'


router.use(async (req: Request, res: Response, next) => {
  //console.log('request came through');
  // find bucket based on current subdomain (prepended part)
  const hostname = req.hostname.split('.')[0]
  const bucket = await pg.bucket.findFirst({
    
    where: {
      subdomain: hostname,
    }    
  });

  if (!bucket) {
    res.status(404).send("No such bucket found")
    return
  }

  console.log(bucket)

  const payload = await mongo.payload.create({
    data: {
      rawRequest: {
        headers: req.headers,
        body: req.body,
      }
    }
  });

  console.log(payload)


  // always returns empty string ??
  let clientIp
  const ipHeader = req.headers["x-forwarded-for"] 
  if (!ipHeader) {
    clientIp = ""
  } else {
    clientIp = Array.isArray(ipHeader) ? ipHeader[0] : ipHeader
  }

  const obj = await pg.request.create ({ 
    data: {
      bucketId: bucket.id, // replace with bucket.id
      createdAt: new Date(),
      method: req.method,
      path: req.path,
      query: req.query,
      payload: payload.id,
      clientIp,
    },
  });

  console.log(obj)
  res.status(200).send("request received")
});


export default router;