// @ts-nocheck
import express, { Request, Response, Application } from "express";
import { pg } from "../src/db"
import { mongo } from '../src/db'

const router = express.Router()

router.get("/:subdomain", async(req: Request, res: Response) => {
  if (req.session.user) {
    const bucket = await pg.bucket.findFirst({
      where: {
        subdomain: req.params.subdomain,
        userId: req.session.user.id
      }
    })
    
    if (!bucket) {
      res.status(404).json({error: "bucket does not exists or you do not have access"})
      return
    }
    
    const bucketId = bucket.owner ? bucket.id : bucket.mainBucketId;
    
    let requests = await pg.request.findMany({
      where: {
        bucketId,
      }
    })
    
    try {
      let promises = requests.map(async(request) => {
        const payload = await mongo.payload.findUnique({
          where: {
            id: request.payload
          }
        })
  
        return {
          ...request,
          rawRequest: payload.rawRequest
        }
      })
      console.log(promises)

      requests = await Promise.all(promises)
      console.log("REQS", requests)

      res.status(200).json(requests)
    } catch(err) {
      res.status(404).json({error: "failed mongodb queries....."})
    }

  } else {
    res.status(401).json({error: "You are not logged in"});
  }
})
export default router
