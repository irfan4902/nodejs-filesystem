import express from 'express';
import path from "path";
import {viewPath} from "../app";

const router = express.Router();

router.get('/file-system', (req, res) => {
    res.sendFile(path.join(viewPath, 'file-system.html'));
});

export default router;