import {DatabaseSync} from 'node:sqlite';
import { existsSync } from 'fs';

// Check if db exists, and if so use the existing db, and associate the db to the sqlite file.
const dbExists = existsSync('./database.sqlite');
const db = new DatabaseSync('./database.sqlite')

// Generate a new db
if (!dbExists) {
    // Prepare users table
    db.exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fname TEXT,
            lname TEXT,
            days_left REAL,
            user_type TEXT,
            password TEXT
        )
    `)

    db.exec(`
        CREATE TABLE requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userID INTEGER,
            name TEXT,
            secret_data TEXT,
            completed BOOLEAN DEFAULT 0,
            FOREIGN KEY(userID) REFERENCES users(id)
        )
    `)

    // USER TYPES: HR (human resources user), Faculty (faculty user), Staff (staff user), Supervisor (supervisor)
    const addUser = db.prepare(`INSERT INTO users (fname, lname, password, days_left, user_type) VALUES (?, ?, ?, ?, ?)`);
    addUser.run(process.env.HR_FNAME || "HR", process.env.LR_FNAME || "user", process.env.HR_PASSWORD || "password", -1, "HR")
}

export default db