import path from "path";
import express from 'express';
import session from 'express-session';

// Import all the routes
import index from './routes/index';
import login from './routes/login';
import file_system from './routes/file-system';
import jobs from './routes/jobs';
import fs from "fs/promises";

const app = express();
const PORT = process.env.PORT || 4000;
export const viewPath = path.join(__dirname, '../views');

// Set up session
app.use(session({
    secret: 'lmao-filesystem',
    resave: false,
    saveUninitialized: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '../')));

let jsonData: any = null;

async function loadConfigData() {
    try {
        const data = await fs.readFile('config.json', 'utf8');
        jsonData = JSON.parse(data);
    } catch (err) {
        console.error('Error reading/parsing JSON file:', err);
    }
}

export function getConfigData() {
    return jsonData;
}

loadConfigData().then(() => {
    // Routes
    app.use('/', index);
    app.use('/', login);
    app.use('/', file_system);
    app.use('/', jobs);

    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});