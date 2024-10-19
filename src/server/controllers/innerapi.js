
const innerapi = async (req, res) => {
    const express = require('express');
    
    const axios = require('axios');
    // Инициализация Express
    const app = express();

    // URL для получения случайного факта
    const FACT_API_URL = 'https://uselessfacts.jsph.pl/random.json?language=en';
    console.log("&{FACT_API_URL}")
    const response = await axios.get(FACT_API_URL);
    if (response.status === 200) {
        const factInEnglish = response.data.text;
        console.log("&{FACT_API_URL}")

        // Перевод факта на русский язык
        //const [factInRussian] = await translate.translate(factInEnglish, 'ru');
        // Отправка переведённого факта
        res.status(200).json({ fact: factInEnglish });
        console.log(factInEnglish)
    } 
    else {
        res.status(response.status).json({ error: 'Не удалось получить факт' });
    }
}

module.exports = { innerapi }