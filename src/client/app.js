const express = require('express');
const bodyParser = require('body-parser');
const routes = require('../server/routes');
const path = require('path');
const { errorHandler } = require('../server/middleware/ErrorHandler');


const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(routes);
app.use(errorHandler);

module.exports = app;