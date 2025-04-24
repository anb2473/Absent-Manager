import jwt from 'jsonwebtoken';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __routesdir = dirname(__filename);
const __dirname = dirname(__routesdir);

function authMiddleware(req, res, next) {
    const token = req.cookies.authToken;
    const id = req.query['id']

    if (!token) {
        console.log('No token')
        return res.redirect("/auth/unauthorized");
    }

    if (!id) {
        console.log('no id')
        return res.redirect("/auth/unauthorized");
    }

    jwt.verify(token, process.env.JWT_SECRET || "change_for_production", (err, decoded) => {
        if (err) {
            console.log(err)
            return res.redirect("/auth/unauthorized");
        }
        req.userID = id; // Set user id to request object
        req.token = token;
        next(); // Call next middleware or route handler
    })

}

export default authMiddleware;