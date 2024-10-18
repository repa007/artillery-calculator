const db = require('../database'); // Импортируем базу данных

const calculateTrajectory = (req, res) => {
    const { x1, y1, x2, y2, height1, height2, weapon } = req.body || {};
    
    // Выполняем расчеты
    const results = performCalculations(x1, y1, x2, y2, height1, height2, weapon, res);
    
    // Проверяем, есть ли результаты
    if (!results) {
        return; // Если результаты не были возвращены, выходим из функции
    }

    // Сохраняем результаты в базе данных
    const { bearing, elevation, timeOfFlight } = results;

    db.run(`INSERT INTO calculations (weapon, coordinates, bearing, elevation, timeOfFlight) VALUES (?, ?, ?, ?, ?)`, 
        [weapon, `${x1},${y1} to ${x2},${y2}`, bearing, elevation, timeOfFlight], 
        function(err) {
            if (err) {
                return res.status(500).json({ message: 'Ошибка при сохранении в базе данных' });
            }
            // Отправляем ответ только один раз
            return res.json(results);
        }
    );
};

// Функция для выполнения расчетов
const performCalculations = (x1, y1, x2, y2, height1, height2, weapon, res) => {
    console.log(x1, y1, x2, y2, height1, height2, weapon);
    let velocity, gravity, trajectory, max_elevation, min_elevation;

    if (weapon == "mortar") {
        velocity = 110; // Примерная скорость снаряда
        gravity = 9.81;
        trajectory = 1; // 0 для пологой траектории, 1 для навесной
        max_elevation = 1580;
        min_elevation = 800;
    } else {
        res.status(400).json({ message: 'Неизвестное оружие' });
        return null; // Возвращаем null, чтобы указать на ошибку
    }

    // Промежуточный расчёт
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const heightDiff = height2 - height1;
    const angle = Math.atan(heightDiff / dist);

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
    let timeOfFlight;
    if (trajectory === 1) {
        mil = Math.atan((velocity ** 2 + P1) / (gravity * dist));
    } else {
        mil = Math.atan((velocity ** 2 - P1) / (gravity * dist));
    }
    let elevation = mil * (1000 * 6400 / 6283); // перевод радиан в мил(НАТО)

    if ((elevation < min_elevation) || (elevation > max_elevation)) {
        res.status(501).json({ message: 'Цель вне зоны поражения' });
        return null; // Возвращаем null, чтобы указать на ошибку
    }

    // Расчёт времени полета
    const v0y = velocity * Math.sin(mil); // Вертикальная составляющая скорости
    const a = -0.5 * gravity;
    const b = v0y;
    const c = -heightDiff; // Уравнение: 0 = h0 + v0y * t + (1/2) * g * t^2

    // Решение квадратного уравнения: at^2 + bt + c = 0
    const discriminant = b ** 2 - 4 * a * c;

    if (discriminant >= 0) {
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        if (trajectory === 1) {
            timeOfFlight = Math.max(t1, t2);
        } else {
            timeOfFlight = Math.min(t1, t2);
        }
    } else {
        timeOfFlight = null; // Нет действительных решений
    }
    console.log(dist, angleRad, bearing, elevation, angle, timeOfFlight);

    // Возвращаем результаты
    return { bearing, elevation, timeOfFlight };
};

module.exports = { calculateTrajectory };