import express from 'express';
import path from "path";
import { view_path, getConfigData } from "../app";

const router = express.Router();

let user_data: any[] = [];

router.get('/login', (req, res) => {
  user_data = getConfigData().users;
  res.sendFile(path.join(view_path, 'login.html'));
});


router.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const storedPassword = getPasswordByUsername(username);

  if (storedPassword === null) {
    return res.status(401).send('User not found.');
  }

  if (storedPassword !== password) {
    return res.status(401).send('Incorrect password.');
  }

  console.log(`User ${username} has logged in.`);

  req.session.loggedin = true;
  req.session.username = username;
  res.redirect('/');
});

function getPasswordByUsername(username_to_find: any) {
  try {
    const user = user_data.find(user => user.username === username_to_find);
    return user.password;
  } catch (e) {
    console.error("Error: " + e);
    return null;
  }
}

export default router;