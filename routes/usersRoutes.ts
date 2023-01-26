// @ts-nocheck

import express, { Request, Response } from "express";
// import { Request } from "@types/express"
const router = express.Router();
import { pg } from '../src/db'
const bcrypt = require("bcrypt")

// user attempts to log in
type userReqBody = {
  username: string,
  passwordHash: string
}

router.post('/', async (req : Request, res: Response) => {
  console.log(req)
  const body : userReqBody = req.body
  const {username, passwordHash} = body;

  console.log(body, username)
  let user = await pg.user.findUnique({
    where: {
      username: username,
    },
  })

  console.log(user)
  if (user) {
    res.status(404).json({error: "Username already exists"})
    return
  }

  if (passwordHash.length < 5) {
    res.status(404).json({error: "Invalid Password"})
    return
  }

  const saltRounds = 10;
  // console.log(password, saltRounds)
  const hashed: string = await bcrypt.hash(passwordHash, saltRounds);

  try {
    const user = await pg.user.create({ 
      data: {
        username: username, 
        passwordHash: hashed,
        createdAt:  new Date()
      },
    });
    // const savedUser = await user.save();
    res.status(201).json(user);
  } catch(err) {
    res.status(404).json({error: 'username already in use'})

  }
});


// login
router.post('/login', async (req : Request, res : Response) => {
  const {username, passwordHash} = {...body};

  // let data = await User.find({});
  let user = await pg.user.findUnique({
    where: {
      username: username,
    },
  })

  if (user) {
    let validCredentials = await bcrypt.compare(passwordHash, user.passwordHash);
    console.log("passwords", user.passwordHash, passwordHash)
    
    if (validCredentials) {
      req.session.user = user
      res.sendStatus(200)
    } else {
      res.status(404).json({error: "invalid password"});
    }
  } else {
    res.status(404).json({error: 'user does not exist'});
  }
});

// delete a user account
router.delete('/:username', async (req: Request, res: Response) => {
  if (req.session.userId) {
    let user = await pg.user.findUnique({
      where: {
        username: username,
      },
    })

    if (user.id === req.session.userId) {
      const deleteUsers = await pg.user.delete({
        where: {
          username: req.params.username
        }
      })
    
      console.log(deleteUsers)
      res.json(deleteUsers)
    }
  }
});

export default router;