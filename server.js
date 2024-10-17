const express = require('express');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const path = require('path');

const app = express();
const PORT = 8080;

// Секретный ключ для подписи JWT
const SECRET_KEY = '123456789';

// Middleware для парсинга JSON
app.use(express.json());

// Middleware для проверки JWT в запросах
app.use(expressJwt({
    secret: SECRET_KEY,
    algorithms: ['HS256'],
    credentialsRequired: false,
    getToken: (req) => req.headers.authorization
}).unless({ path: ['/login'] }));

// Маршрут для входа в систему
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'user' && password === 'password') {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Неверный логин или пароль' });
    }
});

// Обработка ошибок JWT
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ message: 'Неавторизованный доступ' });
    } else {
        next(err);
    }
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка запроса на расчет
app.post('/calculate', async (req, res) => {
    const { x1, y1, x2, y2, height1, height2 } = req.body || {}; // Защита от ошибки
    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined || height1 === undefined || height2 === undefined) {
        return res.status(400).json({ message: 'Недостаточно данных для расчета' });
    }

    console.log(x1, y1, x2, y2, height1, height2);
    const velocity = 110; // Примерная скорость снаряда
    const gravity = 9.81;
    const trajectory = 1; // 0 для пологой траектории, 1 для навесной

    // Промежуточный расчёт
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const heightDiff = height2 - height1;
    const angle = Math.atan((heightDiff) / dist);

    // Расчёт направления
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const angleRad = Math.atan2(deltaX, deltaY); // в радианах
    let bearing = angleRad * (180 / Math.PI); // в градусах
    if (bearing < 0) {
        bearing += 360;
    }

    // Расчёт возвышения
    const P1 = Math.sqrt(velocity ** 4 - gravity * (gravity * dist ** 2 + 2 * heightDiff * velocity ** 2));
    let mil;
    if (trajectory == 1) {
        mil = Math.atan((velocity ** 2 + P1) / (gravity * dist));
    } else {
        mil = Math.atan((velocity ** 2 - P1) / (gravity * dist));
    }
    const elevation = mil * (1000 * 6400 / 6283); // перевод радиан в мил(НАТО)

    // Расчёт времени полета
    const v0y = velocity * Math.sin(mil); // Вертикальная составляющая скорости
    const a = -0.5 * gravity;
    const b = v0y;
    const c = -heightDiff; // Уравнение: 0 = h0 + v0y * t + (1/2) * g * t^2

    // Решение квадратного уравнения: at^2 + bt + c = 0
    const discriminant = b ** 2 - 4 * a * c;

    let timeOfFlight;
    if (discriminant >= 0) {
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (trajectory == 1) {
            timeOfFlight = Math.max(t1, t2);
        } else {
            timeOfFlight = Math.min(t1, t2);
        }
    } else {
        timeOfFlight = null; // Нет действительных решений
    }
    console.log(dist, angleRad, bearing, elevation, angle, timeOfFlight);

    // Возвращаем результаты
    res.json({bearing, elevation, timeOfFlight});
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});