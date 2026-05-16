const { Client } = require('pg');
const client = new Client({ user: 'postgres', host: 'localhost', database: 'mental_health_db', password: '123456', port: 5432 });
client.connect()
  .then(() => client.query('SELECT username, email, "fullName", provider, "providerId" FROM "users"'))
  .then(res => { console.log(JSON.stringify(res.rows, null, 2)); client.end() })
  .catch(err => { console.error(err); client.end() });
