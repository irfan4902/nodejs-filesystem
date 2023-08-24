import express from 'express';
import path from "path";

const router = express.Router();

router.get('/', (req, res) => {
    res.send("This is the about page!");
});

export default router;