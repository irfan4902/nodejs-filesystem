import express from 'express';
import path from "path";
import { view_path, getConfigData } from "../app";

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(view_path, 'index.html'));
});

router.get('/get-filesystems', async (req, res) => {
  let fs_names: string[] = [];

  for (const fs of getConfigData().filesystems) {
    fs_names.push(fs.name);
  }

  res.status(200).json(fs_names);
});

export default router;