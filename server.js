import express from 'express';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authMiddleware from './middleware/authMiddleware.js'; 
import cookieParser from 'cookie-parser';

// Config process.env variables
import dotenv from 'dotenv';
dotenv.config();

const app = express();
// In event in which process.env.PORT fails, backup port implemented to prevent failure
const PORT = process.env.PORT || 8000;

// Locate directory of resources
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware for cookies and JSON data transfer
app.use(express.json());
app.use(cookieParser());
// Configure to serve static files from public
// Handles static requests (i.e. requests for css or js files or images)
// HTML files not currently configured to need public resources, however this is implemented for scalability
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    // Send index.html to client
    // (When client requests index.css it will be auto served by express)
    res.redirect("/login");
})

app.get('/login', (req, res) => {
    // Send login.html to client
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
})

app.get('/wait', (req, res) => {
    // Send wait.html to client
    res.sendFile(path.join(__dirname, 'public', 'wait.html'));
})

// Set up routes
app.use('/auth', authRoutes);
app.use('/user', authMiddleware, userRoutes);

// Innitiate server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})
