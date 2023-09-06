import express from 'express';
import path from "path";
import session from 'express-session'; 
import {viewPath, getConfigData} from "../app";

const router = express.Router();

let userData: any[] = [];

router.get('/login', (req, res) => {
    userData = getConfigData().users;
    res.sendFile(path.join(viewPath, 'login.html'));
});

router.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const storedPassword = getPasswordByUsername(username);
  
    if (storedPassword !== null) {
      console.log('User found!!');
  
      if (storedPassword === password) {
        console.log('Correct password! :D');

        //@ts-ignore
        req.session.loggedin = true;
        //@ts-ignore
        req.session.username = username;
        res.redirect('/');

      } else {
        console.log('WRONG password!! >:(');
      }
    } else {
      console.log('User not found :(');
    }
});

function getPasswordByUsername(usernameToFind: any) {
    console.log("USERNAME TO FIND: " + usernameToFind);
    console.log(userData);

    try {
        const user = userData.find(user => user.username === usernameToFind);
        return user.password;
    } catch (e) {
        console.error("Error: " + e);
        return null;
    }
}

export default router;