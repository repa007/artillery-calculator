const db = require('../database'); // Импортируем базу данных
const express = require('express');

// Функция для регистрации нового пользователя
const register = (req, res) => {
    const { username, password } = req.body;
    console.log(`Попытка регистрации пользователя: ${req.body}`);

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
        if (err) {
            console.error('Ошибка при сохранении пользователя:', err);
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(400).json({ message: 'Пользователь с таким именем уже существует' });
            }
            return res.status(500).json({ message: 'Ошибка при сохранении пользователя' });
        }
        res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
    });
};

// Обновляем обработчик входа в систему
const login = (req, res) => {
    const { username, password } = req.body;

    // Проверяем, что username и password не пустые
    if (!username || !password) {
        return res.status(400).json({ message: 'Имя пользователя и пароль обязательны' });
    }

    // сравниваем логин и пароль из БД с теми, что в запросе 
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ message: 'Неверный логин или пароль' });
        }

        if (user.password === password) {
            const token = generateToken(username);
            return res.json({ token });
        }

        res.status(401).json({ message: 'Неверный логин или пароль' });
    });
};

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Неавторизованный доступ' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Неавторизованный доступ' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = { login, authenticate, register };