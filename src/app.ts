import path from "path";
import express from 'express';

// Import all the routes
import index from './routes/index';
import login from './routes/login';
import file_system from './routes/file-system';
import modify_file from './routes/modify-file';
import jobs from './routes/jobs';

const app = express();
const PORT = process.env.PORT || 3000;
export const viewPath = path.join(__dirname, '../public/views');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', index);
app.use('/', login);
app.use('/', file_system);
app.use('/', modify_file);
app.use('/', jobs);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
