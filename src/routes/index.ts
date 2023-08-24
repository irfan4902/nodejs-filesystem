import express from 'express';
import path from "path";
import {viewPath} from "../app";

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(viewPath, 'index.html'));
});

export default router;