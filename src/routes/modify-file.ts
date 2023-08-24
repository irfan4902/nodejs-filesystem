import express from 'express';
import path from "path";
import {viewPath} from "../app";

const router = express.Router();

router.get('/modify-file', (req, res) => {
    res.sendFile(path.join(viewPath, 'modify-file.html'));
});

export default router;