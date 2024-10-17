const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/calculate', (req, res) => {
    const { x1, y1, x2, y2, height1, height2 } = req.body;
    console.log(x1, y1, x2, y2, height1, height2)
    const velocity = 110; // Примерная скорость снаряда
    const gravity = 9.81
    const trajectory = Boolean(true)// 0 для пологой траектории, 1 для навесной

    // Промежуточный расчёт
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const heightDiff = height2 - height1;
    const angle = Math.atan((heightDiff) / dist);

    // Расчёт направления
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const angleRad = Math.atan2(deltaY, deltaX); // в радианах
    const bearing = angleRad * (180 / Math.PI); // в градусах

    // Расчёт возвышения
    const P1 = Math.sqrt(velocity ** 4 - gravity * (gravity * dist ** 2 + 2 * heightDiff * velocity ** 2));
    const mil = Math.atan((velocity ** 2 + P1) / (gravity * dist));
    if (trajectory){
        const mil = Math.atan((velocity ** 2 + P1) / (gravity * dist));
    }
    else{
        const mil = Math.atan((velocity ** 2 + P1) / (gravity * dist));
    }
    const elevation = mil * (1000 * 6400 / 6283) //перевод радиан в мил(НАТО)

 
    // Расчёт времени полета
    const v0y = velocity * Math.sin(mil); // Вертикальная составляющая скорости
    const a = -0.5 * gravity;
    const b = v0y;
    const c = -heightDiff; // Уравнение: 0 = h0 + v0y * t + (1/2) * g * t^2

    // Решаем квадратное уравнение: at^2 + bt + c = 0
    const discriminant = b ** 2 - 4 * a * c;

    let timeOfFlight;
    if (discriminant >= 0) {
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        timeOfFlight = Math.max(t1, t2); // Берем максимальное время
    } else {
        timeOfFlight = null; // Нет действительных решений
    }
    console.log(dist,angleRad, bearing,  elevation, angle,  timeOfFlight)

    res.json({ elevation: elevation, timeOfFlight: timeOfFlight });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});