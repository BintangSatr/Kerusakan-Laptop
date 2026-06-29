// index.js (paling sederhana)
console.log('Hello from index.js!');
const express = require('express');
console.log('Express loaded!');
const app = express();
console.log('App created!');
app.get('/', (req, res) => {
    res.send('OK');
});
console.log('Route defined!');
app.listen(3000, () => {
    console.log('Server listening!');
});
console.log('End of file');