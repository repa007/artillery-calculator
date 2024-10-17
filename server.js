const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Настройка сессий
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(express.static('public'));

// Пользовательские данные (можно заменить на базу данных)
const users = [{ id: 1, username: 'user', password: 'password' }]; // Пример пользователя

// Настройка стратегии локальной авторизации
passport.use(new LocalStrategy((username, password, done) => {
    const user = users.find(u => u.username === username);
    if (!user) return done(null, false, { message: 'Неверное имя пользователя' });
    if (user.password !== password) return done(null, false, { message: 'Неверный пароль' });
    return done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    const user = users.find(u => u.id === id);
    done(null, user);
});

// Маршруты для авторизации
app.post('/login', passport.authenticate('local'), (req, res) => {
    res.json({ message: 'Успешный вход', user: req.user });
});

app.post('/logout', (req, res) => {
    req.logout();
    res.json({ message: 'Вы вышли из системы' });
});

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обработка запроса на расчет
app.post('/calculate', async (req, res) => {
    const { x1, y1, x2, y2, height1, height2 } = req.body;
    console.log(x1, y1, x2, y2, height1, height2)
    const velocity = 110; // Примерная скорость снаряда
    const gravity = 9.81
    const trajectory = 1// 0 для пологой траектории, 1 для навесной

    // Промежуточный расчёт
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const heightDiff = height2 - height1;
    const angle = Math.atan((heightDiff) / dist);

    // Расчёт направления
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const angleRad = Math.atan2(deltaX, deltaY); // в радианах
    let bearing = angleRad * (180 / Math.PI); // в градусах
    if (bearing < 0){
        bearing += 360;
    }

    // Расчёт возвышения
    const P1 = Math.sqrt(velocity ** 4 - gravity * (gravity * dist ** 2 + 2 * heightDiff * velocity ** 2));
    let mil;
    if (trajectory == 1){
        mil = Math.atan((velocity ** 2 + P1) / (gravity * dist));
    }
    else{
        mil = Math.atan((velocity ** 2 - P1) / (gravity * dist));
    }
    const elevation = mil * (1000 * 6400 / 6283) //перевод радиан в мил(НАТО)

 
    // Расчёт времени полета
    const v0y = velocity * Math.sin(mil); // Вертикальная составляющая скорости
    const a = -0.5 * gravity;
    const b = v0y;
    const c = -heightDiff; // Уравнение: 0 = h0 + v0y * t + (1/2) * g * t^2

    // Тут надо решить квадратное уравнение: at^2 + bt + c = 0
    const discriminant = b ** 2 - 4 * a * c;

    let timeOfFlight;
    if (discriminant >= 0) {
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (trajectory == 1){
            timeOfFlight = Math.max(t1, t2)
        }
        else{
            timeOfFlight = Math.min(t1, t2)
        }
    } else {
        timeOfFlight = null; // Нет действительных решений
    }
    console.log(dist,angleRad, bearing,  elevation, angle,  timeOfFlight)

    // Сохранение запроса в истории
    if (req.isAuthenticated()) {
        const requestData = { x1, y1, x2, y2, height1, height2, elevation, bearing, timeOfFlight };
        const historyFilePath = path.join(__dirname, 'history.json');

        // Чтение существующей истории
        let history = [];
        if (fs.existsSync(historyFilePath)) {
            const data = fs.readFileSync(historyFilePath);
            history = JSON.parse(data);
        }

        // Добавление нового запроса в историю
        history.push({ userId: req.user.id, requestData, timestamp: new Date() });
        fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
    }

    res.json({ elevation, bearing, timeOfFlight });
});

// Получение истории запросов
app.get('/history', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Не авторизован' });
    }

    const historyFilePath = path.join(__dirname, 'history.json');
    if (fs.existsSync(historyFilePath)) {
        const data = fs.readFileSync(historyFilePath);
        const history = JSON.parse(data).filter(entry => entry.userId === req.user.id);
        return res.json(history);
    }

    res.json([]);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});