
import express, { Request, Response, Application } from "express";
const router = express.Router()
import usersRoutes from "./usersRoutes";
import bucketsRoutes from "./bucketsRoutes";
import requestsRoutes from "./requestRoutes";

router.use("/api/buckets", bucketsRoutes)
router.use("/api/requests", requestsRoutes)
router.use("/api/users", usersRoutes)

export default router
// router.use("/api/buckets", bucketsRoutes)
// router.use("/api/requests", requestsRoutes)
// router.use("/api/users", usersRoutes)
