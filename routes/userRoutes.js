import express from 'express';
import db from '../db.js';
import {fileURLToPath} from 'url';
import path, {dirname} from 'path';
import fs from 'fs/promises';

const router = express.Router();

// Locate of module
const __filename = fileURLToPath(import.meta.url);
const __routesdir = dirname(__filename);
const __dirname = dirname(__routesdir);

async function loadFacStaffDashboard(req, res, user, modifiedContent) {
    const filePath = path.join(__dirname, 'public', 'dashboard.html')
    const fileContent = await fs.readFile(filePath, 'utf8');

    modifiedContent = fileContent.replaceAll('Not Available', user.days_left).replaceAll("NAME", user.fname).replaceAll("ROLE", user.user_type).replaceAll("ID_VALUE", req.userID);

    return modifiedContent;
}

async function loadHRDashboard(req, res, user, modifiedContent) {
    const filePath = path.join(__dirname, 'public', 'hr-dashboard.html')
    const fileContent = await fs.readFile(filePath, 'utf8');

    modifiedContent = fileContent.replaceAll('Not Available', user.days_left).replaceAll("NAME", user.fname);

    let replaceText = ""
    modifiedContent = modifiedContent.replaceAll("ID_VALUE", req.userID)

    replaceText = ""
    const selectAllUsers = db.prepare(`SELECT * FROM users`);
    const users = selectAllUsers.all();
    for (const row of users) {
        if (row.fname != 'HR' && row.lname != 'user') {
            replaceText += `
            <p id="${row.id}err" style="color: #d9534f; font-size: 15px; justify-self: center;"></p>
            <div class="request" id="request${row.id}">
                <p id="${row.id}p">${row.fname} ${row.lname}</p>
                <button id="${row.id}" class="verify-request" onclick="toggleForm(this.id)">Pull up user settings</button>
                <button id="${row.id}b" class="verify-request" onclick="deleteUser(this.id)">Delete User</button>
            </div>
            <form id="${row.id}form" style="height: 0; overflow: hidden; transition: height 0.5s ease-in-out;" onsubmit="putUser(event, ${row.id})" action="/user/user-verify?id=ID_VALUE">
                <h1 id="err"></h1><br>
                <label for="n${row.id}fname">First name:</label><br>
                <input type="text" id="n${row.id}fname" name="fname" value="${row.fname}"><br><br>
                <label for="n${row.id}lname">Last name:</label><br>
                <input type="text" id="n${row.id}lname" name="lname" value="${row.lname}"><br><br>
                <label for="n${row.id}password">Password:</label><br>
                <input type="text" id="n${row.id}password" name="password" value="${row.password}"><br><br>
                <label for="n${row.id}usertype">User type:</label>
                <select name="usertype" id="n${row.id}usertype" class="usertype">
                    <option value="Supervisor" ${row.user_type === 'Supervisor' ? 'selected' : ''}>Supervisor</option>
                    <option value="Faculty" ${row.user_type === 'Faculty' ? 'selected' : ''}>Faculty</option>
                    <option value="Staff" ${row.user_type === 'Staff' ? 'selected' : ''}>Staff</option>
                </select><br><br>
                <label for="n${row.id}days">Days left:</label>
                <input type="number" step="any" value="${row.days_left}" id="n${row.id}days" class="usertype">
                <input type="submit" value="Submit">
            </form>
            `
        }
    }
    if (replaceText == "") {
        replaceText = "No Requests"
    }
    modifiedContent = modifiedContent.replaceAll("USERS", replaceText)

    replaceText = ""
    const selectAllApprovedRequests = db.prepare(`SELECT * FROM requests WHERE completed = 1 AND userID = ?`);
    const approvedRequests = selectAllApprovedRequests.all(req.userID);
    for (const row of approvedRequests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}err"></p>
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="deleteRequest(this.id)">Delete Request</button>
        </div>`
    }
    if (replaceText == "") {
        replaceText = "No Requests"
    }
    modifiedContent = modifiedContent.replaceAll("ALL_APPROVED", replaceText)

    return modifiedContent;
}

async function loadSuperDashboard(req, res, user, modifiedContent) {
    const filePath = path.join(__dirname, 'public', 'super-dashboard.html')
    const fileContent = await fs.readFile(filePath, 'utf8');

    modifiedContent = fileContent.replaceAll('Not Available', user.days_left).replaceAll("NAME", user.fname).replaceAll("ROLE", user.user_type);

    let replaceText = ""
    const selectAllRequests = db.prepare(`SELECT * FROM requests WHERE completed = 0 AND userID = ?`);
    const requests = selectAllRequests.all(req.userID);
    for (const row of requests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="execRequest(this.id)">Verify Request</button>
            <button id="${row.id}b" class="verify-request" onclick="deleteRequest(this.id)">Deny</button>
        </div>`
    }
    if (replaceText == "") {
        replaceText = "No Requests"
    }
    modifiedContent = modifiedContent.replaceAll("REQUESTS", replaceText).replaceAll("ID_VALUE", req.userID)

    replaceText = ""
    const selectAllApprovedRequests = db.prepare(`SELECT * FROM requests WHERE completed = 1 AND userID = ?`);
    const approvedRequests = selectAllApprovedRequests.all(req.userID);
    for (const row of approvedRequests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}err"></p>
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="deleteRequest(this.id)">Delete Request</button>
        </div>`
    }
    if (replaceText == "") {
        replaceText = "No Requests"
    }
    modifiedContent = modifiedContent.replaceAll("ALL_APPROVED", replaceText)

    return modifiedContent;
}

router.get('/dashboard', async (req, res) => {
    if (!req.userID) {
        res.redirect("/auth/err/ir")
    }

    const getUser = db.prepare(`SELECT * FROM users WHERE id = ?`)
    const user = getUser.get(req.userID)

    let modifiedContent = "500";
    if (user.user_type != 'HR' && user.user_type != 'Supervisor') {
        modifiedContent = await loadFacStaffDashboard(req, res, user, modifiedContent)
    }
    else if (user.user_type == 'HR') {
        modifiedContent = await loadHRDashboard(req, res, user, modifiedContent)
    }
    else if (user.user_type == 'Supervisor') {
        modifiedContent = await loadSuperDashboard(req, res, user, modifiedContent)
    }

    res.send(modifiedContent);
})

function verifyDays(req, res) {
    const id = req.body['id']
    
    if (!id) {
        return res.json({ret: "Invalid request"})
    }

    const getTaskData = db.prepare(`SELECT * FROM requests WHERE id = ? AND userID = ?`)
    const taskData = getTaskData.get(id, req.userID)

    const secretCmd = JSON.parse(taskData['secret_data'])

    if (!secretCmd || !secretCmd['req']) {
        return res.json({ret: "Failed to commit task, task format was invalid."})
    }

    if (secretCmd['req'] == 'take_days') {
        const decreaseDays = db.prepare(`UPDATE users SET days_left = ? WHERE id = ?`);
        const getUser = db.prepare(`SELECT * FROM users WHERE id = ?`);
        const user = getUser.get(secretCmd['id']);
        const days_left = user.days_left;
        let new_days = NaN;
        if (days_left < 0) {
            return res.json({ret: "Cannot take negative days off"})
        }
        if (days_left - parseFloat(secretCmd['days']) >= 0) {
            new_days = days_left - parseFloat(secretCmd['days']);
        }
        else {
            return res.json({ret: "User does not have enough days left"})
        }
        decreaseDays.run(new_days, secretCmd['id']);
    }

    const removeTask = db.prepare(`UPDATE requests SET completed = 1 WHERE id = ? AND userID = ?`)
    removeTask.run(id, req.userID)

    return res.json({ret: ""})
}

function handleUsers(req, res) {
    const secretCmd = req.body;

    switch (secretCmd['req']) {
        case 'gen_user':
            const days_left_policy = {
                'Supervisor': 10,
                'Faculty': 8,
                'Support Staff': 23,
                'Professional Staff':28
            }
        
            const gen_user = db.prepare('INSERT INTO users (fname, lname, password, days_left, user_type) VALUES (?, ?, ?, ?, ?)')
            const usertype = secretCmd['usertype']
            let policy = "No Policy"
            try {
                policy = days_left_policy[usertype]
            }
            catch (error) { console.log(error) }
            gen_user.run(secretCmd['fname'], secretCmd['lname'], secretCmd['password'], 
                policy, 
                usertype)
            break;
            
        case 'del_user':
            const del_user = db.prepare('DELETE FROM users WHERE id = ?')
            const del_user_requests = db.prepare('DELETE FROM requests WHERE userID = ?')
            try {
                del_user_requests.run(secretCmd['userID'])
                del_user.run(secretCmd['userID'])
            }
            catch (error) { 
                console.log(error) 
                res.json({ret: `Failed to delete user ${secretCmd['userID']}`})
            }
            break;
            
        case 'put_user':
            const update_user = db.prepare('UPDATE users SET fname = ?, lname = ?, password = ?, user_type = ?, days_left = ? WHERE id = ?')
            update_user.run(secretCmd['fname'], secretCmd['lname'], secretCmd['password'], secretCmd['usertype'], secretCmd['days_left'], secretCmd['userID'])
            res.json({ret: "Successfully updated user"})
            break;
            
        case 'del_req':
            const del_req = db.prepare('DELETE FROM requests WHERE id = ?')
            del_req.run(secretCmd['id_num'])
            break;
            
        default:
            console.log(`Unknown request type: ${secretCmd['req']}`)
            break;
    }
}

router.post('/user-verify', async (req, res) => {
    if (!req.body['id']) {
        await handleUsers(req, res)
        
        return
    }

    await verifyDays(req, res)
}) 

function handleDaysRequestFromRequests(req, res) {
    const getTask = db.prepare(`SELECT * FROM requests WHERE id = ? AND userID = ?`)
    const taskData = getTask.get(req.body['id'], req.userID)
    const task = JSON.parse(taskData['secret_data'])
    const days = task['days']
    const date = task['date']
    const getUser = db.prepare(`SELECT * FROM users WHERE fname = ? AND lname = ?`)
    const user = getUser.get('HR', 'user');
    if (user == undefined) {
        return res.json({ret: "Invalid supervisor, please check the name"})
    }
    const userID = user.id

    const getUserById = db.prepare(`SELECT * FROM users WHERE id = ?`)
    const originalUser = getUserById.get(task['id'])
    
    const postRequest = db.prepare(`INSERT INTO requests (userID, name, secret_data, completed) VALUES (?, ?, ?, ?)`)
    let message = `Request from ${originalUser.fname} ${originalUser.lname} to take ${days} days off starting from ${date}`;
    if (days == 0.5) {
        message = `Request from ${originalUser.fname} ${originalUser.lname} to take a half day off on ${date}`
    }

    postRequest.run(
        userID, 
        message, 
        JSON.stringify({
            req: "take_days",
            id: task['id'],
            days: days,
            date: date,
        }),
        1);

    const removeTask = db.prepare(`UPDATE requests SET completed = 1 WHERE id = ? AND userID = ?`)
    removeTask.run(req.body['id'], req.userID)

    return res.json({ret: "Successfully sent request"})
}

function handleDaysRequest(req, res) {
    let {days, date, req_fname, req_lname} = req.body

    const getUser = db.prepare(`SELECT * FROM users WHERE fname = ? AND lname = ?`)
    const user = getUser.get(req_fname, req_lname);
    if (user == undefined) {
        return res.json({ret: "Invalid supervisor, please check the name"})
    }
    const userID = user.id

    const getUserById = db.prepare(`SELECT * FROM users WHERE id = ?`)
    const originalUser = getUserById.get(req.userID)
    
    const postRequest = db.prepare(`INSERT INTO requests (userID, name, secret_data) VALUES (?, ?, ?)`)
    let message = `Request from ${originalUser.fname} ${originalUser.lname} to take ${days} days off starting from ${date}`;
    if (days == 'half') {
        message = `Request from ${originalUser.fname} ${originalUser.lname} to take a half day off on ${date}`
        days = 0.5
    }
    postRequest.run(
        userID, 
        message, 
        JSON.stringify({
            req: "take_days",
            id: req.userID,
            days: days,
            date: date
        }));

    res.json({ret: "Successfully sent request"})
}

router.post('/send-request', async (req, res) => {
    // Forwarding request from open requests based on request ID
    if (req.body['id'] != undefined) {
        await handleDaysRequestFromRequests(req, res)
    }
    // Sending request from raw data
    else {
        await handleDaysRequest(req, res)
    }
})

export default router;