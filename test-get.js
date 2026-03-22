const fs = require('fs');
async function fetchUsers() {
    try {
        const res = await fetch('http://localhost:5000/api/users');
        const data = await res.json();
        const output = "Status: " + res.status + "\nEmails returned: " + data.map(u => u.email).join(', ');
        fs.writeFileSync('output.txt', output, 'utf8');
    } catch (e) {
        console.error(e);
    }
}
fetchUsers();
