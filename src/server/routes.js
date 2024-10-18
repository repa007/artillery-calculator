const express = require('express');
const { login, authenticate, register } = require('./controllers/AuthController');
const { calculateTrajectory } = require('./controllers/CalcController');
const path = require('path');
const db = require('./database');
const router = express.Router();

const app = express();
app.use(express.json()); // Используем встроенный middleware для парсинга application/json

router.post('/register', register);
router.post('/login', login);
router.post('/calculate', authenticate, calculateTrajectory);

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

// Главная страница
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

module.exports = router;