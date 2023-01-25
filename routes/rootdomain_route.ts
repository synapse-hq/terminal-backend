import express, { Request, Response, Application } from "express";
const router = express.Router();
import { pg } from '../src/db'
import { mongo } from '../src/db'
const bcrypt = require("bcrypt")


// user attempts to log in
type userReqBody = {
  username: string,
  passwordHash: string
}

router.post('/new_user', async (req : Request, res: Response) => {
  console.log(req)
  const body : userReqBody = req.body
  const {username, passwordHash} = body;

  console.log(body, username)
  let user = await pg.user.findFirst({
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
  const body : userReqBody = req.body
  const {username, passwordHash} = {...body};

  // let data = await User.find({});
  let user = await pg.user.findFirst({
    where: {
      username: username,
    },
  })

  if (user) {
    let validCredentials = await bcrypt.compare(passwordHash, user.passwordHash);
    console.log("passwords", user.passwordHash, passwordHash)
    
    if (validCredentials) {
      let buckets = await pg.bucket.findMany({
        where: {
          userId: user.id
        }
      })
      res.send({username, buckets,})
    } else {
      res.status(404).json({error: "invalid password"});
    }
  } else {
    res.status(404).json({error: 'user does not exist'});
  }
});

router.delete('/:username', async (req: Request, res: Response) => {
  const deleteUsers = await pg.user.delete({
    where: {
      username: req.params.username
    }
  })

  console.log(deleteUsers)
  res.json(deleteUsers)
});

// do we need this route?
router.get('/', async (req, res, next) => {
  let allUsers = await pg.user.findMany();
  res.send(allUsers)
  // res.send('hello')

});

// create a new bucket
router.post('/', async (req, res) => {

});

export default router;