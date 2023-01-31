// @ts-nocheck

import express, { Request, Response, Application } from "express";
import { pg } from "../src/db"
const router = express.Router()

// import { mongo } from "../src/db"
function uuid(): string {
  let time = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
      time += performance.now();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let random = (time + Math.random() * 16) % 16 | 0;
      time = Math.floor(time / 16);
      return (c === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
  });
}

type newBinReq = {
  username: string
}

// get all active user buckets
router.get("/", async(req: Request, res: Response) => {
 if (req.session.user) {
///
  try {
    const buckets = await pg.bucket.findMany({
      where: {
        userId: req.session.user.id,
        deleted: false
      }
    })

    res.status(200).json(buckets)
  } catch {
    res.status(400).json({error: "invalid user"})
  }
///
  } else {
    res.status(400).json({error:"Not Logged In"});
  }
})

// make a new bucket
router.post("/", async(req: Request, res: Response) => {
  const body : newBinReq = req.body
  const { user } = req.session
	
  if (!user) {
    res.status(404).json({error: "invalid user"})
    return
  }

  const subdomain = user.username + uuid()
  const existingBucket = await pg.bucket.findUnique({
    where: {
      subdomain,
    }
  })

  if (existingBucket) {
    res.status(404).json({error: "UUID has failed to provide a UUID, please try again"})
    return
  }
  
  try {
    const newBucket = await pg.bucket.create({
      data: {
        userId: user.id,
        subdomain,
        deleted: false,
        createdAt: new Date()
      }
    })

    console.log(newBucket)
    res.status(200).json(newBucket)

  } catch {
    res.status(404).json({error: "invalid user"})

  }
})

// set a bucket to deleted
router.delete("/:subdomain", async(req: Request, res: Response) => {
  const { subdomain } = req.params

  if (req.session.user) {
    console.log("DELETE", subdomain)
    try {
      const updated = await pg.bucket.update({
        where: {
          subdomain,
          userid: req.session.user.id
        },
        data: {
          deleted: true
        }
      });
      res.status(200).json({updated})
    } catch {
      res.status(400).json({error: "bucket does not exists"})
    }    
  }
})


export default router
