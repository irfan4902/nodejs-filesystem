import express from 'express';
import path from "path";
import { view_path } from "../app";

const router = express.Router();

router.get('/jobs', (req, res) => {
  res.sendFile(path.join(view_path, 'jobs.html'));
});

export default router;