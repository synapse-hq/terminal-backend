
import express, { Request, Response, Application, NextFunction } from "express";
import vhost = require('vhost')
import { pg } from './src/db'
import { mongo } from './src/db'
import * as dotenv from "dotenv"
dotenv.config();

const port = process.env.PORT;
const domain:string = process.env.DOMAIN!;

import subDomainRoutes from './routes/subdomain_route';
import rootDomainRoutes from "./routes/rootDomainRoutes"

//sessions
const session = require("express-session");
const RedisStore = require('connect-redis')(session);
const { createClient } = require('redis')
let redisClient = createClient({ legacyMode: true })
redisClient.connect().catch(console.error);


const app: Application = express();
// sockets
import * as http from 'http';
import * as WebSocket from 'ws';

// sockets
const server = http.createServer(app);
const wss = new WebSocket.Server({server, path: "/api/socket/buckets"})

// msg queue
const amqp = require("amqplib/callback_api")


// when connection established
wss.on('connection', (ws: WebSocket) => {

  //// logic for retrieving request for a given for subdomain
    const getReqs = async(subdomain: string) => {
      subdomain = subdomain.toString()
      console.log("SUBDOMAIN VAL IN ASYNC FUNC", subdomain)
      
      const bucket = await pg.bucket.findFirst({
        where: {
          subdomain,
        }
      })
      
      console.log(bucket)
      if (!bucket) {
        console.log("NO BUCKET FOUND")
        ws.send("NO BUCKET FOUND")
        return
      }
      
      let requests = await pg.request.findMany({
        where: {
          bucketId: bucket.id,
        }
      })
      console.log(requests, "BEFORE getting raw request")
      try {
        let promises = requests.map(async(request) => {
          const payload = await mongo.payload.findUnique({
            where: {
              id: request.payload
            }
          })
    
          return {
            ...request,
            rawRequest: payload?.rawRequest
          }
        })
    
        requests = await Promise.all(promises)
      } catch {
        ws.send("request retrieval failed")
        console.log("reqs retrieval failed")
      }
    
      ws.send(JSON.stringify(requests));
    }
  ////

    //function executed when websocket on server receives a message
    ws.on('message', (subdomain: string) => {
        
          console.log(subdomain)
          subdomain = subdomain.toString()
          //log the received message
          console.log('bucket subdomain: %s', subdomain);
          console.log("bucket requests: \n\n")

          /// creating a channel with amqp msg q
          // amqp.connect("amqp://diego:password@localhost/RabbitsInParis", function(error0: any, connection: any) {
          //   if (error0) {
          //     console.log(error0)
          //     throw error0;
          //   }

          //   // create the exchange and msg queu
          //   connection.createChannel(function(error1: any, channel: any) {
          //     if (error1) {
          //       throw error1
          //     }
          //     channel.assertExchange(subdomain, "fanout", {durable: false})              
              
          //     // create a queueu that will consume from the newly created queue
          //     channel.assertQueue(subdomain, {
          //       exclusive: true
          //     }, function(error2: any, q: any) {
          //       if (error2) {
          //         throw error2;
          //       }
          //       console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);
          //       channel.bindQueue(q.queue, subdomain, '');
          
          //       channel.consume(q.queue, function(msg: any) {
          //         if(msg.content) {
          //             console.log(" [x] %s", msg.content.toString());
          //           }
          //       }, {
          //         noAck: true
          //       });
          //     });
  
          //   });

          //   //immediately after subscribe to the created qmsg broker /
            
          //   setTimeout(function() {
          //     connection.close();
          //     process.exit(0);
          //   }, 10000);
          // })
  
        // execute reqs retrieval function
        getReqs(subdomain)
    });

    
    ws.on("close", () => {

      console.log("ws connection closed")
    })

    // initial connection acknowledgement on client and server side
    console.log("websocket connection established")
    ws.send("websocket connection established")


});

//

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


app.use(vhost(domain, rootDomainRoutes));
app.use(vhost("www." + domain, rootDomainRoutes));
app.use(vhost("*." + domain, subDomainRoutes));

app.use((req: Request, res: Response) => {
  	console.log(req.hostname)
	console.log(req.path)
	res.send("END OF ROUTES")
});

server.listen(port, () => console.log('Server listening on port '+ port));
  