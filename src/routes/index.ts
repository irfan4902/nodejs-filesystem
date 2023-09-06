import express from 'express';
import path from "path";
import { viewPath, getConfigData } from "../app";

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(viewPath, 'index.html'));
});

router.get('/get-filesystems', async (req, res) => {
  let filesystem_names: string[] = [];

  for (let element of getConfigData().filesystems) {
    filesystem_names.push(element.name);
  }

  res.status(200).json(filesystem_names);
});

export default router;