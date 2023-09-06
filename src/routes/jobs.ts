import express from 'express';
import path from "path";
import { viewPath } from "../app";

const router = express.Router();

router.get('/jobs', (req, res) => {
  res.sendFile(path.join(viewPath, 'jobs.html'));
});

export default router;