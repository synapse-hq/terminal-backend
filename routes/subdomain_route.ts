import express, { Request, Response, Router } from 'express';
const router:Router = express.Router();
import { pg } from '../src/db'
import { mongo } from '../src/db'

router.use(async (req, res, next) => {

  next();
});

// return all requests associated with current subdomain
router.get('/', (req, res, next) => {

});


// store webhook request in db
router.post('/', (req, res, next) => {

});

export default router;