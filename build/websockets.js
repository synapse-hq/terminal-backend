"use strict";
// import express, { Request, Response, Application, NextFunction } from "express";
// // sockets
// import * as http from 'http';
// import * as WebSocket from 'ws';
// const app = express()
// // sockets
// const server = http.createServer(app);
// const wss = new WebSocket.Server({server, path: "/api/socket/buckets"})
// // msg queue
// const amqp = require("amqplib/callback_api")
// // when connection established
// wss.on('connection', (ws: WebSocket) => {
//     //function executed when websocket on server receives a message
//     ws.on('message', (subdomain: string) => {
//           subdomain = subdomain.toString()
//           //log the received message
//           console.log('bucket subdomain: %s', subdomain);
//           // creating a channel with amqp msg q
//           amqp.connect("amqp://diego:password@localhost/RabbitsInParis", function(error0: any, connection: any) {
//             if (error0) {
//               console.log(error0)
//               throw error0;
//             }
//             connection.createChannel(function(error1: any, channel: any) {
//               if (error1) {
//                 throw error1
//               }
//               // create a queueu that will consume from the newly created queue
//               channel.assertQueue(subdomain, {
//                 durable: false,
//                 exclusive: false
//               }, function(error2: any, q: any) {
//                 if (error2) {
//                   throw error2;
//                 }
//                 channel.prefetch(100);
//                 channel.consume(q.queue, function(msg: any) {
//                   if(msg.content) {
//                       ws.send(msg.content.toString())
//                     }
//                 }, {
//                   noAck: true
//                 });
//               });
//             })
//             //immediately after subscribe to the created qmsg broker /
//           })
//     });
//     ws.on("close", () => {
//       console.log("ws connection closed")
//     })
//     // initial connection acknowledgement on client and server side
//     console.log("websocket connection established")
// });
// server.listen(3001, () => console.log('Web Socket erver listening on port '+ 3001));
//# sourceMappingURL=websockets.js.map