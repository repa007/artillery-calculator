const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const express = require('express');

const dbPath = path.join(__dirname, 'database.db'); // Путь к базе данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключение к базе данных успешно.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS calculations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            weapon TEXT,
            coordinates TEXT,
            bearing REAL,
            elevation REAL,
            timeOfFlight REAL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES users(id)
        )`);
    }
});

module.exports = db;