// @ts-nocheck
import express, { Request, Response, Application } from "express";
import { pg } from "../src/db"
import { mongo } from '../src/db'

const router = express.Router()


// router.get("/", async(req: Request, res: Response) => {
//   const requests = await pg.request.findMany({})
//   res.status(200).json(requests)
// })

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
  
    let requests = await pg.request.findMany({
      where: {
        bucketId: bucket.id,
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
  
      requests = await Promise.all(promises)
      res.status(200).json(requests)
    } catch {
      res.status(404).json({error: "failed mongodb queries....."})
    }

  } else {
    res.status(401).json({error: "You are not logged in"});
  }
})
export default router
