import express from 'express';
import path from "path";
import {viewPath, getConfigData} from "../app";
import passport from 'passport';

const router = express.Router();

let userData:any = [];

router.get('/login', (req, res) => {
    userData = getConfigData().users;
    console.log(JSON.stringify(userData));
    res.sendFile(path.join(viewPath, 'login.html'));
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

export default router;