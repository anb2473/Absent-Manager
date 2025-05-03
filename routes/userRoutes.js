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

    modifiedContent = fileContent.replaceAll('BERIEVEMENT DAYS', user.berievement_days_left).replaceAll("NAME", user.fname).replaceAll('DAYS', user.days_left).replaceAll("ROLE", user.user_type).replaceAll("ID_VALUE", req.userID);

    let replaceText = ""
    const selectAllPendingRequests = db.prepare(`SELECT * FROM request_status WHERE userID = ? AND status = 'Pending'`)
    const pendingRequests = selectAllPendingRequests.all(req.userID);
    for (const row of pendingRequests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="deleteRequest(this.id)">Delete Request</button>
            <p id="${row.id}err"></p>
        </div>
        `
    }
    if (replaceText == "") {
        replaceText = "No Pending Requests"
    }
    modifiedContent = modifiedContent.replaceAll('PENDING', replaceText)

    replaceText = ""
    const selectAllDeniedRequests = db.prepare(`SELECT * FROM request_status WHERE userID = ? AND status = 'Denied'`)
    const deniedRequests = selectAllDeniedRequests.all(req.userID);
    for (const row of deniedRequests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="deleteRequest(this.id)">Delete Request</button>
            <p id="${row.id}err"></p>
        </div>
        `
    }
    if (replaceText == "") {
        replaceText = "No Denied Requests"
    }
    modifiedContent = modifiedContent.replaceAll('DENIED', replaceText)

    replaceText = ""
    const selectAllApprovedRequests = db.prepare(`SELECT * FROM request_status WHERE userID = ? AND status = 'Approved'`)
    const approvedRequests = selectAllApprovedRequests.all(req.userID);
    for (const row of approvedRequests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="deleteRequest(this.id)">Delete Request</button>
            <p id="${row.id}err"></p>
        </div>
        `
    }
    if (replaceText == "") {
        replaceText = "No Approved Requests"
    }
    modifiedContent = modifiedContent.replaceAll('APPROVED', replaceText)

    return modifiedContent;
}

async function loadHRDashboard(req, res, user, modifiedContent) {
    const filePath = path.join(__dirname, 'public', 'hr-dashboard.html')
    const fileContent = await fs.readFile(filePath, 'utf8');

    modifiedContent = fileContent.replaceAll('DAYS', user.days_left).replaceAll("NAME", user.fname);

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
                    <option value="Faculty" ${row.user_type === 'Faculty' ? 'selected' : ''}>Faculty</option>
                    <option value="Support Staff" ${row.user_type === 'Support Staff' ? 'selected' : ''}>Support Staff</option>
                    <option value="Professional Staff" ${row.user_type === 'Professional Staff' ? 'selected' : ''}>Professional Staff</option>
                    <option value="Admin" ${row.user_type === 'Admin' ? 'selected' : ''}>Admin</option>
                </select><br><br>
                <label for="n${row.id}userview">
                    <input type="checkbox" id="n${row.id}userview" name="userview" ${row.user_view === 'Supervisor' ? 'checked' : ''}>
                    Supervisor
                </label><br>
                <label for="n${row.id}days">Days left:</label>
                <input type="number" step="any" value="${row.days_left}" id="n${row.id}days" class="usertype"><br><br>
                <input type="number" step="any" value="${row.berievement_days_left}" id="n${row.id}berievement_days" class="usertype"><br><br>
                <input type="submit" value="Submit">
            </form>
            `
        }
    }
    if (replaceText == "") {
        replaceText = "No User"
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

    modifiedContent = fileContent.replaceAll('BERIEVEMENT DAYS', user.berievement_days_left).replaceAll('DAYS', user.days_left).replaceAll("NAME", user.fname).replaceAll("ROLE", user.user_type);

    let replaceText = ""
    const selectAllRequests = db.prepare(`SELECT * FROM requests WHERE completed = 0 AND userID = ?`);
    const requests = selectAllRequests.all(req.userID);
    for (const row of requests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="execRequest(this.id)">Verify Request</button>
            <button id="${row.id}fail" class="verify-request" onclick="denyRequest(this.id)">Deny</button>
        </div>`
    }
    if (replaceText == "") {
        replaceText = "No Requests"
    }
    modifiedContent = modifiedContent.replaceAll("REQUESTS", replaceText).replaceAll("ID_VALUE", req.userID)

    // Add approved requests (sent to user) section
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

    // Add pending requests section
    replaceText = ""
    const selectAllPendingRequests = db.prepare(`SELECT * FROM request_status WHERE userID = ? AND status = 'Pending'`)
    const pendingRequests = selectAllPendingRequests.all(req.userID);
    for (const row of pendingRequests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="deletePendRequest(this.id)">Delete Request</button>
            <p id="${row.id}err"></p>
        </div>
        `
    }
    if (replaceText == "") {
        replaceText = "No Pending Requests"
    }
    modifiedContent = modifiedContent.replaceAll('PENDING', replaceText)

    // Add denied requests section
    replaceText = ""
    const selectAllDeniedRequests = db.prepare(`SELECT * FROM request_status WHERE userID = ? AND status = 'Denied'`)
    const deniedRequests = selectAllDeniedRequests.all(req.userID);
    for (const row of deniedRequests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="deletePendRequest(this.id)">Delete Request</button>
            <p id="${row.id}err"></p>
        </div>
        `
    }
    if (replaceText == "") {
        replaceText = "No Denied Requests"
    }
    modifiedContent = modifiedContent.replaceAll('DENIED', replaceText)

    // Add approved requests (sent from user) section
    replaceText = ""
    const selectAllReturnedApprovedRequests = db.prepare(`SELECT * FROM request_status WHERE userID = ? AND status = 'Approved'`)
    const returnedApprovedRequests = selectAllReturnedApprovedRequests.all(req.userID);
    for (const row of returnedApprovedRequests) {
        replaceText += `
        <div class="request" id="request${row.id}">
            <p id="${row.id}p">${row.name}</p>
            <button id="${row.id}b" class="verify-request" onclick="deletePendRequest(this.id)">Delete Request</button>
            <p id="${row.id}err"></p>
        </div>
        `
    }
    if (replaceText == "") {
        replaceText = "No Approved Requests"
    }
    modifiedContent = modifiedContent.replaceAll('APPROVED', replaceText)

    return modifiedContent;
}

router.get('/dashboard', async (req, res) => {
    if (!req.userID) {
        res.redirect("/auth/err/ir")
    }

    const getUser = db.prepare(`SELECT * FROM users WHERE id = ?`)
    const user = getUser.get(req.userID)

    let modifiedContent = "500";
    if (user.user_view != 'HR' && user.user_view != 'Supervisor') {
        modifiedContent = await loadFacStaffDashboard(req, res, user, modifiedContent)
    }
    else if (user.user_view == 'HR') {
        modifiedContent = await loadHRDashboard(req, res, user, modifiedContent)
    }
    else if (user.user_view == 'Supervisor') {
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
        const getUser = db.prepare(`SELECT * FROM users WHERE id = ?`);
        const user = getUser.get(secretCmd['id']);

        if (secretCmd['type'] == 'berievement days') {
            const days_left = user.berievement_days_left;
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

            const berievementDays = db.prepare(`UPDATE users SET berievement_days_left = ? WHERE id = ?`);
            berievementDays.run(new_days, secretCmd['id']);
        }
        else if (secretCmd['type'] != 'jury duty days' && secretCmd['type'] != 'professional days') {
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

            const decreaseDays = db.prepare(`UPDATE users SET days_left = ? WHERE id = ?`);
            decreaseDays.run(new_days, secretCmd['id']);
        }
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
                'Faculty': [8, 3],
                'Support Staff': [23, 3],
                'Professional Staff': [28, 3],
                'Admin': [33, 3]
            }
        
            const gen_user = db.prepare('INSERT INTO users (fname, lname, password, days_left, berievement_days_left, user_type, user_view) VALUES (?, ?, ?, ?, ?, ?, ?)')
            const usertype = secretCmd['usertype']
            const userview = secretCmd['userview']
            let policy = [NaN, NaN]
            try {
                policy = days_left_policy[usertype]
            }
            catch (error) { console.log(error) }
            gen_user.run(
                secretCmd['fname'], secretCmd['lname'], secretCmd['password'], 
                policy[0], policy[1], usertype, userview)
            break;
            
        case 'del_user':
            const del_user_requests = db.prepare('DELETE FROM requests WHERE userID = ?')
            const del_user_status = db.prepare('DELETE FROM request_status WHERE userID = ?')
            const del_user = db.prepare('DELETE FROM users WHERE id = ?')
            try {
                // First delete all related records
                del_user_requests.run(secretCmd['userID'])
                del_user_status.run(secretCmd['userID'])
                // Then delete the user
                del_user.run(secretCmd['userID'])
            } catch (error) { 
                console.log(error) 
                res.json({ret: `Failed to delete user ${secretCmd['userID']}`})
            }
            break;
            
        case 'put_user':
            const update_user = db.prepare('UPDATE users SET fname = ?, lname = ?, password = ?, user_type = ?, user_view = ?, days_left = ?, berievement_days_left = ? WHERE id = ?')
            update_user.run(secretCmd['fname'], secretCmd['lname'], secretCmd['password'], secretCmd['usertype'], secretCmd['userview'], secretCmd['days_left'], secretCmd['berievement_days_left'], secretCmd['userID'])
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
    const type = task['type']
    const getUser = db.prepare(`SELECT * FROM users WHERE fname = ? AND lname = ?`)
    const user = getUser.get('HR', 'user');
    if (user == undefined) {
        return res.json({ret: "Invalid supervisor, please check the name"})
    }
    const userID = user.id

    const getUserById = db.prepare(`SELECT * FROM users WHERE id = ?`)
    const originalUser = getUserById.get(task['id'])
    
    const postRequest = db.prepare(`INSERT INTO requests (userID, name, secret_data, completed) VALUES (?, ?, ?, ?)`)
    let message = `Request from ${originalUser.fname} ${originalUser.lname} to take ${days} ${type} off starting from ${date}`;
    if (days == 0.5) {
        message = `Request from ${originalUser.fname} ${originalUser.lname} to take a half ${type} off on ${date}`
    }

    postRequest.run(
        userID, 
        message, 
        JSON.stringify({
            req: "take_days",
            id: task['id'],
            days: days,
            date: date,
            pending_id: task['pending_id'],
            type: type
        }),
        1);

    const removeTask = db.prepare(`UPDATE requests SET completed = 1 WHERE id = ? AND userID = ?`)
    removeTask.run(req.body['id'], req.userID)

    return res.json({ret: "Successfully processed request"})
}

function handleDaysRequest(req, res) {
    let {days, date, req_fname, req_lname, type} = req.body

    const getUser = db.prepare(`SELECT * FROM users WHERE fname = ? AND lname = ?`)
    const user = getUser.get(req_fname, req_lname);
    if (user == undefined) {
        return res.json({ret: "Invalid supervisor, please check the name"})
    }
    const userID = user.id

    const getUserById = db.prepare(`SELECT * FROM users WHERE id = ?`)
    const originalUser = getUserById.get(req.userID)
    
    const postRequest = db.prepare(`INSERT INTO requests (userID, name, secret_data) VALUES (?, ?, ?)`)
    let message = `Request from ${originalUser.fname} ${originalUser.lname} to take ${days} ${type.toLowerCase().replace("other", "days")} off starting from ${date}`;
    if (days == 'half') {
        message = `Request from ${originalUser.fname} ${originalUser.lname} to take a half ${type.toLowerCase().replace("other", "days").slice(0, -1)} off on ${date}`
        days = 0.5
    }
    const result = postRequest.run(
        userID, 
        message, 
        JSON.stringify({
            req: "take_days",
            id: req.userID,
            days: days,
            date: date,
            pending_id: req.body['pending_id'],
            type: type.toLowerCase().replace("other", "days")
        }));

    res.json({ret: "Successfully processed request"})
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

router.post('/pend-request', (req, res) => {
    const postRequest = db.prepare(`INSERT INTO request_status (userID, name, status) VALUES (?, ?, ?)`)
    const result = postRequest.run(req.userID, 
    `Pending for request to take ${req.body['days']} ${req.body['days'] === 'half' ? req.body['type'].toLowerCase().replace("option", "days").slice(0, -1) : req.body['type'].toLowerCase().replace("option", "days")} off at ${req.body['date']}`, 
    'Pending')
    res.send(result.lastInsertRowid.toString())
})

router.delete('/pend-request', (req, res) => {
    if (req.body['from_dir_id']) {
        const delRequest = db.prepare(`DELETE FROM request_status WHERE id = ? AND userID = ?`)
        delRequest.run(req.body['id'], req.userID)
        return res.send(200)
    }

    const getRequest = db.prepare(`SELECT * FROM requests WHERE id = ?`)
    const request = getRequest.get((parseInt(req.body['id'])+ 1).toString())
    const secretCmd = JSON.parse(request.secret_data)
    const pending_id = secretCmd['pending_id']
    const id = secretCmd['id']
    const delRequest = db.prepare(`DELETE FROM request_status WHERE id = ? AND userID = ?`)
    delRequest.run(pending_id, id)
    res.send(200)
})

router.put('/pend-request', (req, res) => {
    const getRequest = db.prepare(`SELECT * FROM requests WHERE id = ?`)
    const id = req.body['id']
    const request = getRequest.get(id)
    const secretCmd = JSON.parse(request.secret_data)
    const userID = secretCmd['id']
    const insertRequest = db.prepare(`INSERT INTO request_status (userID, name, status) VALUES (?, ?, ?)`)
    insertRequest.run(userID, req.body['name'].replace("Request", `${req.body['status']} request`), req.body['status'])
    res.send(200)
})

export default router;