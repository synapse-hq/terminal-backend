import { channel } from 'diagnostics_channel';
import express, { Request, Response, Router } from 'express';
import { request } from 'http';
const router:Router = express.Router();
import { pg } from '../src/db'
import { mongo } from '../src/db'
const amqp = require("amqplib/callback_api")


router.use(async (req: Request, res: Response, next) => {
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

  const payload = await mongo.payload.create({
    data: {
      rawRequest: {
        headers: req.headers,
        body: req.body,
      }
    }
  });

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

  // create new obj to send
  const requestToEmit = {...obj, rawRequest: payload}

      // creating a channel with amqp msg q
      amqp.connect('amqp://diego:password@localhost/RabbitsInParis', async function(error0: any, connection: any) {
        if (error0) {
          throw error0;
        }

        // create the exchange and msg queu
        connection.createChannel(async function(error1: any, channel: any) {
          if (error1) {
            throw error1
          }
          
          channel.assertQueue(subdomain, {
            durable: true
          });
          channel.sendToQueue(subdomain, Buffer.from(JSON.stringify(requestToEmit)), {
            persistent: true
          });
        });

        setTimeout(() => {
          connection.close()
        }, 2500)
      });

  res.status(200).send("request received")
});


export default router;