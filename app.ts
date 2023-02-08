
import express, { Request, Response, Application, NextFunction } from "express";
import vhost = require('vhost')
import { pg } from './src/db'
import { mongo } from './src/db'
import * as dotenv from "dotenv"
dotenv.config();
import url from "url";

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

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const app: Application = express();
// app.use(cookieParser())

// sockets
import * as http from 'http';
import * as WebSocket from 'ws';
import { Store } from "express-session";

// sockets
const server = http.createServer(app);
// const wss = new WebSocket.Server({server, path: "/api/socket/buckets"})
const bucketWS = new WebSocket.Server({noServer: true});
const userSearchWS = new WebSocket.Server({noServer: true});
const userSearchInactiveTimeout = 30000

// msg queue
const amqp = require("amqplib/callback_api")

// Bucket websocket connection
bucketWS.on('connection', (ws: WebSocket) => {
  //function executed when websocket on server receives a message
  ws.on('message', (subdomain: string) => {
        subdomain = subdomain.toString()
        //log the received message
        // creating a channel with amqp msg q
        amqp.connect("amqp://diego:password@localhost/RabbitsInParis", function(error0: any, connection: any) {
          if (error0) {
            console.log(error0)
            throw error0;
          }

          connection.createChannel(function(error1: any, channel: any) {
            if (error1) {
              throw error1
            }

            channel.assertExchange(subdomain, 'fanout', {
              durable: false,
            })
            // create a queueu that will consume from the newly created queue
            channel.assertQueue('', {
              exclusive: true,
            }, function(error2: any, q: any) {
              if (error2) {
                throw error2;
              }

              channel.bindQueue(q.queue, subdomain, '')
              // channel.prefetch(100);
              
              channel.consume(q.queue, function(msg: any) {
                if(msg.content) {
                    ws.send(msg.content.toString())
                  }
              }, {
                noAck: true
              });
            });
          })
          //immediately after subscribe to the created qmsg broker /
        })
  });


  ws.on("close", () => {

    console.log("Bucket ws connection closed")
  })

// initial connection acknowledgement on client and server side
console.log("Bucket websocket connection established")
});

userSearchWS.on('connection', (ws: any, req: any) => {
  const closeWS = () => setTimeout(() => ws.close(), userSearchInactiveTimeout);
  let closeTimer = closeWS()

  ws.on('message', async(searchBlob: string) => {
    clearTimeout(closeTimer)
    const search = searchBlob.toString();
    
    const matches = await pg.user.findMany({
      take: 7,
      where: {
        username: {
          startsWith: search
        },
      },
      orderBy: {
        username: 'asc'
      },
    });

    await ws.send(JSON.stringify(matches)) 
    closeTimer = closeWS()
  })

  ws.on('close', () => {
    console.log('User search WS closed')
  })

  console.log("User Search websocket connection established")
})

// handle client WebSocket connection initialization
server.on('upgrade', (req : Request, socket, head) => {
  const path = url.parse(req.url).pathname
  
  // WS routes
  if (path === "/api/socket/buckets") {
    bucketWS.handleUpgrade(req, socket, head, (ws: any) => {
      bucketWS.emit('connection', ws, req)
    })
  } else if (path === "/api/socket/user-search") {
    userSearchWS.handleUpgrade(req, socket, head, (ws: any) => {
      userSearchWS.emit('connection', ws, req);
    })
  } else {
    socket.destroy();
  }
})


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

app.use(cookieParser())
app.use(bodyParser())


app.use(vhost(domain, rootDomainRoutes));
app.use(vhost("www." + domain, rootDomainRoutes));
app.use(vhost("*." + domain, subDomainRoutes));

app.use((req: Request, res: Response) => {
	res.send("END OF ROUTES")
});

server.listen(port, () => console.log('Server listening on port '+ port));
  
