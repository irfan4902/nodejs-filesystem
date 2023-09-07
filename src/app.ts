import path from "path";
import fs from "fs/promises";
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import session from 'express-session';

// Import all the routes
import index from './routes/index';
import login from './routes/login';
import file_system from './routes/file-system';
import jobs from './routes/jobs';
import logout from './routes/logout';

const app = express();
const PORT = process.env.PORT || 4000;
export const view_path = path.join(__dirname, '../views');

// Set up session
app.use(session({
  secret: 'lmao-filesystem',
  resave: false,
  saveUninitialized: true
}));

// Declare your custom session properties
declare module 'express-session' {
  interface Session {
    loggedin: boolean;
    username: string;
  }
}

function checkLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (!req.session.loggedin) {
    console.log('Not logged in.');
    res.redirect('/login');
  } else {
    next();
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
  // Routes that don't need authentication middleware 
  // (has to be placed here above the other routes or else it won't work)
  app.use('/', login);
  app.use('/', logout);

  // Routes that require authentication middleware
  app.use('/', checkLoggedIn, index);
  app.use('/', checkLoggedIn, file_system);
  app.use('/', checkLoggedIn, jobs);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});