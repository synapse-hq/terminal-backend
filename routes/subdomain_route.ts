import express, { Request, Response, Router } from 'express';
const router:Router = express.Router();
import { pg } from '../src/db'
import { mongo } from '../src/db'
const amqp = require("amqplib/callback_api")


router.use(async (req: Request, res: Response, next) => {
  //console.log('request came through');
  // find bucket based on current subdomain (prepended part)
  const subdomain = req.hostname.split('.')[0]
  const bucket = await pg.bucket.findFirst({
    
    where: {
      subdomain: subdomain,
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
  // PAYLOAD = {rawRequest: {headers, body}}

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

  //obj = request obj = {method, path, payload,}
  // create new obj to send
  const requestToEmit = {...obj, rawRequest: payload}

      // // creating a channel with amqp msg q
      // amqp.connect('amqp://diego:password@localhost/RabbitsInParis', function(error0: any, connection: any) {
      //   if (error0) {
      //     throw error0;
      //   }

      //   // create the exchange and msg queu
      //   connection.createChannel(function(error1: any, channel: any) {
      //     if (error1) {
      //       console.log(error1)
      //       throw error1
      //     }
          
      //     channel.assertExchange(subdomain, "fanout", {durable: false})              
      //     channel.publish(subdomain, "", Buffer.from("SENT AFTER REQUEST SENT TO SUBDOMAIN"))
      //     // create a queueu that will consume from the newly created queue

      //   });
      // });

  
  console.log(requestToEmit)
  res.status(200).send("request received")
});


export default router;