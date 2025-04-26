import express from 'express';
import db from '../db.js';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Locate of module
const __filename = fileURLToPath(import.meta.url);
const __routesdir = dirname(__filename);
const __dirname = dirname(__routesdir);

router.get('/login', (req, res) => {
    try {
        const {fname, lname, password} = req.query;

        const query_users = db.prepare(
            'SELECT * FROM users WHERE fname = ? AND lname = ? AND password = ?',
        );

        const user = query_users.get(fname, lname, password)

        if (user) {
            // Authentication successful, redirect to the desired URL
            const token = jwt.sign({id: user.id}, process.env.JWT_SECRET || "change_for_production", {expiresIn: '1h'}); // JWT token expires in 1 hours
            res.cookie('authToken', token, {
                httpOnly: true,
                sameSite: 'strict', // Helps prevent CSRF
                maxAge: 60 * 60 * 1000 // 1 hour (matches expiresIn)
            });
            return res.redirect(`/user/dashboard?id=${user.id}`);
        } else {
            // Auth failure, redirecting to user not found
            return res.redirect(`err/unf`);
        }
    }
    catch (error) {
        // Error (most likely invalid request), potentially server error
        console.log(error)
        res.redirect("err/ir")
    }
})

// Error pages
router.get('/err/unf', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'unf.html'));
})

router.get('/err/ir', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ir.html'));
})

router.get('/unauthorized', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "unauthorized.html"))
})

// Export router to server auth routes
export default router;