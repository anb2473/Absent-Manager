import express from 'express';
import db from '../db.js';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import fs from 'fs/promises';
import fetch from 'node-fetch'

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __routesdir = dirname(__filename);
const __dirname = dirname(__routesdir);

router.get('/dashboard', async (req, res) => {
    if (!req.userID) {
        res.redirect("/auth/err/ir")
    }

    const get_user = db.prepare(`SELECT * FROM users WHERE id = ?`)
    const user = get_user.get(req.userID)

    let modifiedContent = "500";
    if (user.user_type != 'HR' && user.user_type != 'Supervisor') {
        const filePath = path.join(__dirname, 'public', 'dashboard.html')
        const fileContent = await fs.readFile(filePath, 'utf8');

        modifiedContent = fileContent.replaceAll('Not Available', user.days_left).replaceAll("NAME", user.fname).replaceAll("ROLE", user.user_type).replaceAll("ID_VALUE", req.userID);
    }
    else if (user.user_type == 'HR') {
        const filePath = path.join(__dirname, 'public', 'hr-dashboard.html')
        const fileContent = await fs.readFile(filePath, 'utf8');

        modifiedContent = fileContent.replaceAll('Not Available', user.days_left).replaceAll("NAME", user.fname);

        var replaceText = ""
        const selectAll = db.prepare(`SELECT * FROM requests WHERE completed = 0 AND user_id = ?`);
        const rows = selectAll.all(req.userID);
        console.log(rows)
        for (const row of rows) {
            replaceText += `
            <div class="request" id="request${row.id}">
                <p id="${row.id}p">${row.name}</p>
                <button id="${row.id}b" class="verify-request" onclick="execRequest(this.id)">Verify Request</button>
            </div>`
        }
        if (replaceText == "") {
            replaceText = "No Requests"
        }
        modifiedContent = modifiedContent.replaceAll("REQUESTS", replaceText).replaceAll("ID_VALUE", req.userID)
    }
    else if (user.user_type == 'Supervisor') {
        const filePath = path.join(__dirname, 'public', 'super-dashboard.html')
        const fileContent = await fs.readFile(filePath, 'utf8');

        modifiedContent = fileContent.replaceAll('Not Available', user.days_left).replaceAll("NAME", user.fname).replaceAll("ROLE", user.user_type);

        var replaceText = ""
        const selectAll = db.prepare(`SELECT * FROM requests WHERE completed = 0 AND user_id = ?`);
        const rows = selectAll.all(req.userID);
        for (const row of rows) {
            replaceText += `
            <div class="request" id="request${row.id}">
                <p id="${row.id}p">${row.name}</p>
                <button id="${row.id}b" class="verify-request" onclick="execRequest(this.id)">Verify Request</button>
            </div>`
        }
        if (replaceText == "") {
            replaceText = "No Requests"
        }
        modifiedContent = modifiedContent.replaceAll("REQUESTS", replaceText).replaceAll("ID_VALUE", req.userID)
    }

    res.send(modifiedContent);
})

router.post('/user-verify', (req, res) => {
    const id = req.body['id']
    
    if (!id) {
        return res.json({ret: "Invalid request"})
    }

    const get_task_data = db.prepare(`SELECT * FROM requests WHERE id = ? AND user_id = ?`)
    const task_data = get_task_data.get(id, req.userID)

    const secret_cmd = JSON.parse(task_data['secret_data'])

    if (!secret_cmd || !secret_cmd['req']) {
        return res.json({ret: "Failed to commit task, task format was invalid."})
    }

    const days_left_policy = {
        'Supervisor': 10,
        'Faculty': 8,
        'Staff': 20
    }

    if (secret_cmd['req'] == 'gen_user') {
        const gen_user = db.prepare('INSERT INTO users (fname, lname, password, days_left, user_type) VALUES (?, ?, ?, ?, ?)')
        const usertype = secret_cmd['usertype']
        let policy = "No Policy"
        try {
            policy = days_left_policy[usertype]
        }
        catch (error) { console.log(error) }
        gen_user.run(secret_cmd['fname'], secret_cmd['lname'], secret_cmd['password'], 
            policy, 
            usertype)
    }
    else if (secret_cmd['req'] == 'take_days' && req.userID == 1) {
        const decrease_days = db.prepare(`UPDATE users SET days_left = ? WHERE id = ?`);
        const get_user = db.prepare(`SELECT * FROM users WHERE id = ?`);
        const user = get_user.get(secret_cmd['id']);
        const days_left = user.days_left;
        let new_days = NaN;
        if (days_left - parseInt(secret_cmd['days']) >= 0) {
            new_days = days_left - parseInt(secret_cmd['days']);
        }
        else {
            return res.json({ret: "User does not have enough days left"})
        }
        decrease_days.run(new_days, secret_cmd['id']);
    }

    const remove_task = db.prepare(`UPDATE requests SET completed = 1 WHERE id = ? AND user_id = ?`)
    remove_task.run(id, req.userID)

    return res.json({ret: ""})
}) 

router.post('/send-request', (req, res) => {
    if (req.body['id'] != undefined) {
        const get_task = db.prepare(`SELECT * FROM requests WHERE id = ? AND user_id = ?`)
        const task_data = get_task.get(req.body['id'], req.userID)
        const task = JSON.parse(task_data['secret_data'])
        const days = task['days']
        const date = task['date']
        const get_user = db.prepare(`SELECT * FROM users WHERE fname = ? AND lname = ?`)
        const user = get_user.get('HR', 'user');
        if (user == undefined) {
            return res.json({ret: "Invalid supervisor, please check the name"})
        }
        const user_id = user.id

        const get_user_by_id = db.prepare(`SELECT * FROM users WHERE id = ?`)
        const o_user = get_user_by_id.get(task['id'])
        
        const post_request = db.prepare(`INSERT INTO requests (user_id, name, secret_data) VALUES (?, ?, ?)`)
        post_request.run(
            user_id, 
            `Request from ${o_user.fname} ${o_user.lname} to take ${days} days off starting from ${date}`, 
            JSON.stringify({
                req: "take_days",
                id: task['id'],
                days: days,
                date: date
            }));

        const remove_task = db.prepare(`UPDATE requests SET completed = 1 WHERE id = ? AND user_id = ?`)
        remove_task.run(req.body['id'], req.userID)

        return res.json({ret: "Successfully sent request"})
    }
    else {
        const {days, date, req_fname, req_lname} = req.body

        const get_user = db.prepare(`SELECT * FROM users WHERE fname = ? AND lname = ?`)
        const user = get_user.get(req_fname, req_lname);
        if (user == undefined) {
            return res.json({ret: "Invalid supervisor, please check the name"})
        }
        const user_id = user.id

        const get_user_by_id = db.prepare(`SELECT * FROM users WHERE id = ?`)
        const o_user = get_user_by_id.get(req.userID)
        
        const post_request = db.prepare(`INSERT INTO requests (user_id, name, secret_data) VALUES (?, ?, ?)`)
        console.log(user_id)
        post_request.run(
            user_id, 
            `Request from ${o_user.fname} ${o_user.lname} to take ${days} days off starting from ${date}`, 
            JSON.stringify({
                req: "take_days",
                id: req.userID,
                days: days,
                date: date
            }));

        res.json({ret: "Successfully sent request"})
    }
})

export default router;