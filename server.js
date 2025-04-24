import express from 'express'
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import authRoutes from './routes/authRoutes.js'; // Import auth routes
import userRoutes from './routes/userRoutes.js'; // Import auth routes
import authMiddleware from './middleware/authMiddleware.js'; 
import fs from 'fs/promises';
import cookieParser from 'cookie-parser';

const app = express()
const PORT = process.env.PORT || 8000;

// Locate directory of resources
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());
app.use(cookieParser());
// Configure to serve static files from public
// This line also configures the server to automatically serve the fanta.css and styles.css when the browser requests them
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    // Send index.html to client
    // (When client requests index.css it will be auto served by express)
    res.redirect("/login")
})

app.get('/login', (req, res) => {
    // Send login.html to client
    // (When client requests index.css it will be auto served by express)
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
})

app.get('/sign-up', async (req, res) => {
    // Send sign-up.html to client
    // (When client requests index.css it will be auto served by express)
    const filePath = path.join(__dirname, 'public', 'sign-up.html')
    const fileContent = await fs.readFile(filePath, 'utf8');
    console.log(fileContent)
    // res.sendFile(path.join(__dirname, 'public', 'sign-up.html'));
    res.send(fileContent)
})

app.get('/wait', (req, res) => {
    // Send wait.html to client
    // (When client requests index.css it will be auto served by express)
    res.sendFile(path.join(__dirname, 'public', 'wait.html'));
})

app.use('/auth', authRoutes)
app.use('/user', authMiddleware, userRoutes)

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})
