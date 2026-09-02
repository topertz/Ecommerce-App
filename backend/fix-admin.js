const db = require('./database');

const result = db
	.prepare("UPDATE users SET role = ? WHERE username = ?")
	.run('admin', 'admin123');

console.log('Updated rows:', result.changes);

db.close();