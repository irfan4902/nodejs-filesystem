import express from 'express';
import path from "path";
import {viewPath, getConfigData} from "../app";

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(viewPath, 'index.html'));
});

router.get('/get-filesystems', async (req, res) => {
    let jsonData = getConfigData();
    res.status(200).json(jsonData.filesystems);
});

export default router;