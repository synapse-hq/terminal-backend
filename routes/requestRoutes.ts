import express, { Request, Response, Application } from "express";
import { pg } from "../src/db"
const router = express.Router()


router.get("/", async(req: Request, res: Response) => {
  const requests = await pg.request.findMany({})
  res.status(200).json(requests)
})

router.get("/:subdomain", async(req: Request, res: Response) => {
  const bucket = await pg.bucket.findUnique({
    where: {
      subdomain: req.params.subdomain
    }
  })

  if (!bucket) {
    res.status(400).json({error: "bucket does not exists"})
    return
  }

  const requests = await pg.request.findMany({
    where: {
      bucketId: bucket.id,
    }
  })

  res.status(200).json(requests)
})
export default router