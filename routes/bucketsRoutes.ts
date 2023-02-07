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
  const existingBucket = await pg.bucket.findFirst({
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

type shareBucketReq = {
  shareUser: string
  shareBucket: string
};

router.post("/share", async(req: Request, res: Response) => {
  console.log("SHARING ATTEMPT", req.body)
  if (req.session.user) {
    const body : shareBucketReq = req.body
    const { shareUser, shareBucket } = body;

    const user = await pg.user.findUnique({
      where: {
        username: shareUser,
      },
    })

    if (user.id === req.session.user.id ) {
      res.status(400).json({error: "You are the owner of this bucket"})
    }
  
    if (!user) {
      res.status(404).json({error: "User does not exists"})
      return
    }

    console.log("USER id",user.id)
    const bucket = await pg.bucket.findFirst({
      where: {
        userId: user.id,
        subdomain: shareBucket,
        deleted: false,
      }
    })
    
    console.log("TO SHARE", bucket)
    if (bucket) {
      res.status(200).json(bucket)
    }

    const bucketOwner = await pg.bucket.findFirst({
      where: {
        userId: req.session.user.id,
        subdomain: shareBucket,
        deleted: false,
        owner: true,
      }
    })

    if (!bucketOwner) {
      res.status(401).json({error: "You are not the owner of this bucket"})
      return
    }

    try {
      const sharedBucket = await pg.bucket.create({
        data: {
          userId: user.id,
          subdomain: shareBucket,
          deleted: false,
          createdAt: bucketOwner.createdAt,
          sharedAt: new Date(),
          owner: false,
          mainBucketId: bucketOwner.id,
        }
      });

      res.status(200).json(sharedBucket)
      return
    } catch(error) {
      res.status(500).json({error: "Something went wrong"});
    }

  } else {
    res.status(401).json({error: "Must be logged in, possible session timeout"})
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
