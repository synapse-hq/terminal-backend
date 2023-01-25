"use strict";
exports.__esModule = true;
var express_1 = require("express");
var dotenv = require("dotenv");
dotenv.config();
var app = (0, express_1["default"])();
var port = process.env.PORT;
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
app.get('/', function (req, res) {
    res.send('hello');
});
app.listen(port, function () { return console.log('Server listening on port ' + port); });
