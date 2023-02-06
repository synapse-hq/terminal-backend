// @ts-nocheck
import express, { Request, Response } from "express";
const router = express.Router();
import { pg } from '../src/db'
const bcrypt = require("bcrypt")

// user attempts to log in
type userReqBody = {
  username: string,
  passwordHash: string
}

router.get('/session_test', async (req : Request, res: Response) => {
  console.log("REQ SESSION")
	if (req.session.user) {
    console.log(req.session.user.username)
		res.status(200).json({username: req.session.user.username})
	} else {
		res.status(404).json({error: "Not logged in"})
	}
})

router.post('/', async (req : Request, res: Response) => {
  const body : userReqBody = req.body
  const {username, passwordHash} = body;

  if (!username) {
    res.status(404).json({error: "Username or password not present"});
    return
  }

  let user = await pg.user.findUnique({
    where: {
      username: username,
    },
  })

  if (user) {
    res.status(404).json({error: "Username already exists"})
    return
  }

  if (!passwordHash) {
    res.status(404).json({error: "No Password Given"})
    return
  }
	
  if (passwordHash.length < 5) {
    res.status(404).json({error: "Invalid Password"})
    return
  }

  const saltRounds = 10;
  const hashed: string = await bcrypt.hash(passwordHash, saltRounds);

  try {
    const user = await pg.user.create({ 
      data: {
        username: username, 
        passwordHash: hashed,
        createdAt:  new Date()
      },
    });
    res.status(201).json(user);
  } catch(err) {
    res.status(404).json({error: 'username already in use'})

  }
});


// login
router.post('/login', async (req : Request, res : Response) => {
  const {username, passwordHash} = {...req.body};

  if (!username) {
    res.status(404).json({error: "No Username Given"})
    return
  }

  if (!passwordHash) {
    res.status(404).json({error: "No Password Given"})
    return
  }

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
      res.status(200).json({username: user.username})
    } else {
      res.status(404).json({error: "invalid password"});
    }
  } else {
    res.status(404).json({error: 'user does not exist'});
  }
});

router.post('/logout', async(req: Request, res: Response) => {
  if (req.session.user) {
    delete req.session.user
    res.status(200).json({session: req.session})
  } else {
    res.status(402).json({error: "not signed in"})
  }
})

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
    
      res.json(deleteUsers)
    }
  }
});

export default router;
