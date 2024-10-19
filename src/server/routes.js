const express = require('express');
const { login, authenticate, register } = require('./controllers/AuthController');
const { calculateTrajectory } = require('./controllers/CalcController');
const path = require('path');
const db = require('./database');
const jwt = require('jsonwebtoken'); // Импортируем jwt для проверки токена
const router = express.Router();
const async = require('async');
const { innerapi } = require('./controllers/innerapi');


// Middleware для парсинга JSON
router.use(express.json());

// Регистрация нового пользователя
router.post('/register', register);

// Вход в систему
router.post('/login', login);

// Расчет траектории
router.post('/calculate', authenticate, calculateTrajectory);

// Получение истории расчетов
router.get('/calculations', authenticate, (req, res) => {
    const userId = req.userId; // Получаем userId из токена

    db.all(`SELECT * FROM calculations WHERE userId = ?`, [userId], (err, rows) => {
        if (err) {
            console.error('Ошибка при получении расчетов:', err);
            return res.status(500).json({ message: 'Ошибка при получении расчетов' });
        }
        res.json(rows); // Возвращаем все расчеты для данного пользователя
    });
});

// Удаление записи
router.delete('/calculations/:id', authenticate, (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM calculations WHERE id = ?`, id, function(err) {
        if (err) {
            return res.status(500).json({ message: 'Ошибка при удалении записи' });
        }
        res.json({ message: 'Запись успешно удалена' });
    });
});

// для фактов
router.get('/fact', async (req, res) => {
    await innerapi(req, res);
});

// Главная страница
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Экспортируем маршруты
module.exports = router;