const path = require('path');
const app = require('./src/client/app');

const PORT = 8080;

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});