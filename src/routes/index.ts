import express from 'express';
import path from "path";
import { view_path, getConfigData } from "../app";

const router = express.Router();

let user_data: any[] = [];

router.get('/', (req, res) => {
  user_data = getConfigData().users;
  res.sendFile(path.join(view_path, 'index.html'));
});

router.get('/get-filesystems', async (req, res) => {
  const username = req.session.username;
  const user_permissions = getPermissionsByUsername(username);

  let fs_names: string[] = [];

  for (const fs of getConfigData().filesystems) {
    if (user_permissions != null && user_permissions.includes(fs.name)) {
      fs_names.push(fs.name);
    }
  }

  res.status(200).json(fs_names);
});

function getPermissionsByUsername(username_to_find: string): string[] | null {
  const user = user_data.find(user => user.username === username_to_find);

  if (user) {
    return user.permissions;
  } else {
    return null;
  }
}

export default router;