require('dotenv').config();

const bcrypt = require('bcrypt');
const db = require('./database');

async function createAdmin() {
    const username = process.argv[2];
    const password = process.argv[3];

    if (!username || !password) {
        console.error('Usage: node create-admin.js <username> <password>');
        process.exit(1);
    }

    if (password.length < 8) {
        console.error('Password must be at least 8 characters.');
        process.exit(1);
    }

    const existingUser = db
     .prepare(`
        SELECT id
        FROM users
        WHERE username = ?
    `)
    .get(username);

    if (existingUser) {
        console.error('Username already exists.');
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    db.prepare(`
     INSERT INTO users
     (username, password, role)
     VALUES (?, ?, 'admin')
    `).run(
     username,
     hashedPassword
    );

    console.log(`Admin "${username}" created successfully.`);
    db.close();
}

createAdmin();