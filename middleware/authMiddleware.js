import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
dotenv.config();

function authMiddleware(req, res, next) {
    // Token stored in cookies, id stored in query params
    const token = req.cookies.authToken;
    const id = req.query['id']

    // Ensure token and id are present
    if (!token) {
        console.log('No token')
        return res.redirect("/auth/unauthorized");
    }

    if (!id) {
        console.log('no id')
        return res.redirect("/auth/unauthorized");
    }

    // Use JWT to verify user identity
    // In event in which process.env.JWT_SECRET fails, backup key implemented to prevent failure
    jwt.verify(token, process.env.JWT_SECRET || "backup_key", (err, decoded) => {
        // Check for errors from JWT
        // Error logging most likely indicates an invalid JWT token, however may indicate server failure
        if (err) {
            console.log(err)
            return res.redirect("/auth/unauthorized");
        }
        req.userID = id;
        req.token = token;
        next();
    })

}

// Export middleware function to server routes
export default authMiddleware;