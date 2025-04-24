import express from 'express';
import db from '../db.js';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import jwt from 'jsonwebtoken';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __routesdir = dirname(__filename);
const __dirname = dirname(__routesdir);

router.get('/login', async (req, res) => {
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
            console.log(res.cookie)
            return res.redirect(`/user/dashboard?id=${user.id}`); // Replace '/dashboard' with your target URL
        } else {
            // Auth failure, redirecting to user not found
            return res.redirect(`err/unf`);
        }
    }
    catch (error) {
        console.log(error)
        res.redirect("err/ir")
    }
})

router.get('/err/unf', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'unf.html'));
})

router.get('/err/ir', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ir.html'));
})

router.post('/send-request', (req, res) => {
    const {fname, lname, password, usertype, req_fname, req_lname} = req.body

    const get_user = db.prepare(`SELECT * FROM users WHERE fname = ? AND lname = ?`)
    const user = get_user.get(req_fname, req_lname);
    const user_id = user.id
    
    const post_request = db.prepare(`INSERT INTO requests (user_id, name, secret_data) VALUES (?, ?, ?)`)
    post_request.run(
        user_id, 
        `Request to create new ${usertype} account for ${fname} ${lname}`, 
        JSON.stringify({
            req: "gen_user",
            usertype: usertype,
            fname: fname,
            lname: lname,
            password: password
        }));
    res.redirect('/wait')
})

router.get('/unauthorized', (req, res) => {
    res.sendFile(path.join(__dirname, "public", "unauthorized.html"))
})

export default router;