import express, { Request, Response, Application } from "express";
const router = express.Router();
import { pg } from '../src/db'
import { mongo } from '../src/db'


// user attempts to log in

router.post('/login')

// do we need this route?
router.get('/', async (req, res, next) => {
  let allUsers = await pg.user.findMany();
  res.send(allUsers)

});

// create a new bucket
router.post('/', async (req, res) => {

});

export default router;