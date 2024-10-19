const { calculateTrajectory } = require('./CalcController'); // Импортируем функцию
const db = require('../database'); // Импортируем базу данных

// Мокаем базу данных для тестирования
jest.mock('../database');

describe('calculateTrajectory', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {
                x1: 0,
                y1: 0,
                x2: 100,
                y2: 100,
                height1: 0,
                height2: 0,
                weapon: 'mortar'
            }
        };

        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });

    it('should calculate trajectory and save to database', async () => {
        db.run.mockImplementation((query, params, callback) => {
            callback(null); // Симулируем успешное выполнение запроса
        });

        await calculateTrajectory(req, res);

        expect(res.json).toHaveBeenCalled(); // Проверяем, что ответ был отправлен
    });

    it('should return error for unknown weapon', async () => {
        req.body.weapon = 'unknownWeapon'; // Устанавливаем неизвестное оружие

        await calculateTrajectory(req, res);

        expect(res.status).toHaveBeenCalledWith(400); // Проверяем, что статус 400 был установлен
        expect(res.json).toHaveBeenCalledWith({ message: 'Неизвестное оружие' }); // Проверяем, что правильное сообщение об ошибке было отправлено
    });
});