// Вспомогательные функции.
async function calculateTableHeight(tableData, headerRowHeight = 25, dataRowHeight = 15) {
    return headerRowHeight + (tableData.length * dataRowHeight);
};

function formatNumber(num) {
    try {
        return num.toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    } catch {
        return num;
    };
};

async function drawMonthlyIncomeText(page, amount, rectangleArea, regularFont, boldFont, amountFont, color, symbol) {
    const texts = [
        {
            text: "Ваш ежемесячный доход",
            fontSize: 14,
            font: boldFont,
            yOffset: 2,
            textColor: rgb(0, 0, 0) // Черный цвет для первого текста
        },
        {
            text: "на основании данных анкетирования",
            fontSize: 10,
            font: regularFont,
            yOffset: 5,
            textColor: rgb(0, 0, 0) // Черный цвет для второго текста
        },
        {
            text: `${symbol}${amount}`,
            fontSize: 28,
            font: amountFont,
            yOffset: 5,
            textColor: color // Оригинальный цвет для цифры
        }
    ];
    
    let currentY = rectangleArea.y + rectangleArea.height - 4; // Начинаем от верхнего края с отступом 4px
    
    const results = [];
    
    for (const textConfig of texts) {
        const textWidth = textConfig.font.widthOfTextAtSize(textConfig.text, textConfig.fontSize);
        const textHeight = textConfig.fontSize * 0.8;
        
        // Центрируем по горизонтали
        const x = rectangleArea.x + (rectangleArea.width - textWidth) / 2;
        
        // Позиционируем по вертикали с учетом отступа
        const y = currentY - textConfig.yOffset - textHeight;
        
        page.drawText(textConfig.text, {
            x: x,
            y: y,
            size: textConfig.fontSize,
            font: textConfig.font,
            color: textConfig.textColor // Используем индивидуальный цвет для каждого текста
        });
        
        results.push({
            x,
            y,
            textWidth,
            textHeight,
            text: textConfig.text,
            fontSize: textConfig.fontSize,
            color: textConfig.textColor
        });
        
        // Обновляем текущую позицию Y для следующего текста
        currentY = y;
    }
    
    return results; // Возвращаем массив результатов для каждого текстового блока
};

async function drawCenteredText(page, text, rectangleArea, font, fontSize, color, align = 'center', symbol = "", is_monthly_income = false, boldFont, amountFont) {
    // Если это ежемесячный доход, используем специальное форматирование
    if (is_monthly_income) {
        return await drawMonthlyIncomeText(page, text, rectangleArea, font, boldFont, amountFont, color, symbol);
    }
    
    // Стандартное форматирование для остальных случаев
    // Добавляем математический символ.
    text = `${symbol}${text}`;

    // Рассчитываем ширину текста
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    
    // Рассчитываем высоту текста (примерно)
    const textHeight = fontSize * 0.8;
    
    // Вычисляем позицию в зависимости от выравнивания
    let x;
    switch (align) {
        case 'left':
            x = rectangleArea.x + 4;
            break;
        case 'right':
            x = rectangleArea.x + rectangleArea.width - textWidth - 5;
            break;
        case 'center':
        default:
            x = rectangleArea.x + (rectangleArea.width - textWidth) / 2;
            break;
    }
    
    const y = rectangleArea.y + (rectangleArea.height - textHeight) / 2;
    
    // Рисуем текст
    page.drawText(text, {
        x: x,
        y: y,
        size: fontSize,
        font: font,
        color: color
    });
    
    return { x, y, textWidth, textHeight, align };
};

async function drawRectangleWithCheckmarks(page, text, rectangleArea, color, textColor, custom_font, custom_bold_font, amountFont, is_monthly_income = false, symbol = "", is_text_in_box = "") {
    const { x, y, width, height } = rectangleArea;

    let YOffset = 0;
    if (is_text_in_box != "") {
        YOffset = 17; 
    };

    // Рисуем основной прямоугольник
    page.drawRectangle({
        x: x,
        y: y - YOffset,
        width: width,
        height: height,
        color: color
    });

    // Если is_text_in_box = true, обрабатываем текст как массив
    let checkmarkYOffset = 0;
    let textElements = [];

    if (is_text_in_box != "" && Array.isArray(text)) {
        // Рассчитываем высоту для смещения галочек
        checkmarkYOffset = 40; // Достаточно места для двух строк текста
        
        // Собираем текстовые элементы для отрисовки
        textElements = [
            {
                text: text[0],
                font: custom_bold_font,
                color: rgb(0, 0, 0),
                size: 12
            },
            {
                text: text[1],
                font: custom_bold_font,
                color: rgb(0, 0, 0),
                size: 12
            },
            {
                text: text[2],
                font: custom_font,
                color: rgb(0, 0, 0),
                size: 10
            }
        ];
    }

    // 1) Левый верхний угол (смещенные галочки)
    // Вертикальная линия галочки
    page.drawLine({
        start: { x: x - 25, y: y + height + 21 + (checkmarkYOffset - YOffset) },
        end: { x: x - 25, y: y + height + 1 + (checkmarkYOffset - YOffset) },
        thickness: 1.5,
    });
    // Горизонтальная линия галочки
    page.drawLine({
        start: { x: x - 25, y: y + height + 21 + (checkmarkYOffset - YOffset) },
        end: { x: x, y: y + height + 21 + (checkmarkYOffset - YOffset) },
        thickness: 1.5,
    });

    // 2) Правый верхний угол (смещенные галочки)
    // Вертикальная линия галочки
    page.drawLine({
        start: { x: x + width + 25, y: y + height + 21 + (checkmarkYOffset - YOffset) },
        end: { x: x + width + 25, y: y + height + 1 + (checkmarkYOffset - YOffset) },
        thickness: 1.5,
    });
    // Горизонтальная линия галочки
    page.drawLine({
        start: { x: x + width + 25, y: y + height + 21 + (checkmarkYOffset - YOffset) },
        end: { x: x + width, y: y + height + 21 + (checkmarkYOffset - YOffset) },
        thickness: 1.5,
    });

    // 3) Левый нижний угол
    page.drawLine({
        start: { x: x - 25, y: y - (21 + YOffset) },
        end: { x: x - 25, y: y - (1 + YOffset) },
        thickness: 1.5,
    });
    page.drawLine({
        start: { x: x - 25, y: y - (21 + YOffset) },
        end: { x: x, y: y - (21 + YOffset) },
        thickness: 1.5,
    });

    // 4) Правый нижний угол
    page.drawLine({
        start: { x: x + width + 25, y: y - (21 + YOffset) },
        end: { x: x + width + 25, y: y - (1 + YOffset) },
        thickness: 1.5,
    });
    page.drawLine({
        start: { x: x + width + 25, y: y - (21 + YOffset) },
        end: { x: x + width, y: y - (21 + YOffset) },
        thickness: 1.5,
    });

    // Отрисовка текста внутри галочек (если is_text_in_box = true)
    if (is_text_in_box && textElements.length > 0) {
        const thirdTextY = (y - YOffset) + height + 2;
        const secondTextY = thirdTextY + 20;
        const firstTextY = secondTextY + 10;

        let textCoordinates;
        if (is_text_in_box == "remaining") {
            textCoordinates = {
                x1: 359,
                y1: firstTextY,
                x2: 344,
                y2: thirdTextY,
                x3: 377,
                y3: secondTextY
            };
        } else {
            textCoordinates = {
                x1: 78,
                y1: firstTextY,
                x2: 106,
                y2: thirdTextY,
                x3: 134,
                y3: secondTextY
            };
        };

        // Отрисовываем первый текст.
        page.drawText(textElements[0].text, {
            x: textCoordinates.x1,
            y: textCoordinates.y1,
            color: rgb(0, 0, 0),
            size: 12,
            font: custom_bold_font
        });

        // Отрисовываем второй текст.
        page.drawText(textElements[1].text, {
            x: textCoordinates.x3,
            y: textCoordinates.y3,
            color: rgb(0, 0, 0),
            size: 12,
            font: custom_bold_font
        });

        // Отрисовываем третий текст.
        page.drawText(textElements[2].text, {
            x: textCoordinates.x2,
            y: textCoordinates.y2,
            color: rgb(0, 0, 0),
            size: 10,
            font: custom_font
        });
    }

    // Пишем основной текст внутри прямоугольника (третий элемент массива или обычный текст)
    const mainText = is_text_in_box ? text[3] : text;
    if (is_text_in_box) {
        rectangleArea.y = rectangleArea.y - YOffset;
    };

    await drawCenteredText(page, mainText, rectangleArea, custom_font, 28, textColor, "center", symbol, is_monthly_income, custom_bold_font, amountFont);

    return y - 21;
};

// Основные функции.
//_______________________________________________________________________________________________________________________________________________________________
// Обрабатываем зарисовку 2 страницы.
async function draw_title_page(page, pdfDoc, font, bold) {
    // Скачиваем лого.
    const url = "https://i.ibb.co/sxY5H22/mfpc-logo-for-pdf.png";
    const pngImageBytes = await fetch(url).then((res) => res.arrayBuffer())
    const pngImage = await pdfDoc.embedPng(pngImageBytes);

    // Рисуем лого.
    page.drawImage(pngImage, {
        x: 460,
        y: 768,
        width: 101,
        height: 46
    });

    // Рисуем прямоугольники с надписью "Раздел №1".
    // 1 прямоугольник.
    page.drawRectangle({
        x: 40,
        y: 792,
        width: 12,
        height: 21,
        color: rgb(1, 0.85, 0.18)
    });

    // 2 прямоугольник.
    page.drawRectangle({
        x: 49,
        y: 792,
        width: 386,
        height: 21,
        color: rgb(1, 0.92, 0)
    });

    // Линия под прямоугольниками.
    page.drawLine({
        start: { x: 28, y: 845},
        end: { x: 434, y: 845},
        color: rgb(0, 0, 0)
    });

    // Текст.
    page.drawText("Раздел № 1", {
        x: 60,
        y: 799,
        font: bold,
        size: 16,
        color: rgb(0, 0, 0),
    });

    // Второй текст.
    page.drawText("Анализ материального положения заёмщика", {
        x: 48,
        y: 776,
        font: font,
        size: 16,
        color: rgb(0, 0, 0),

    });

    // Текст номер запроса.
    page.drawText("Номер запроса: 1HPDK4", {
        x: 45,
        y: 751,
        font: font,
        size: 10,
        color: rgb(0, 0, 0)
    });

    // Текст Кол клиента.
    page.drawText("Код клиента: 613326", {
        x: 45,
        y: 738,
        font: font,
        size: 10,
        color: rgb(0, 0, 0)
    });

    // Текст Дата и время рассмотрения: 1HPDK4.
    page.drawText("Дата и время рассмотрения: 1HPDK4", {
        x: 302,
        y: 751,
        font: font,
        size: 10,
        color: rgb(0, 0, 0)
    });

};

async function draw_personal_data(page, font, bold, data) {
    // Рисуем линию.
    page.drawLine({
        start: { x: 43, y: 708},
        end: { x: 554, y: 708},
        color: rgb(0.85, 0.85, 0.85)
    });

    // Рисуем текст Персональные данные заёмщика.
    page.drawText("Персональные данные заёмщика", {
        x: 51,
        y: 712,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // Рисуем текст фамилия.
    page.drawText("Фамилия", {
        x: 46,
        y: 690,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем текст имя.
    page.drawText("Имя", {
        x: 46,
        y: 675,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем текст Отчество.
    page.drawText("Отчество", {
        x: 46,
        y: 660,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем текст Прежняя фамилия .
    page.drawText("Прежняя фамилия", {
        x: 46,
        y: 645,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем текст (при наличии)
    page.drawText("(при наличии)", {
        x: 46,
        y: 630,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем прямоугольник для Прежняя фамилия.
    page.drawRectangle({
        x: 152,
        y: 629,
        width: 148,
        height: 25,
        color: rgb(0.85, 0.85, 0.85)
    });

    // Рисуем текст Дата рождения
    page.drawText("Дата рождения", {
        x: 319,
        y: 690,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем текст Полных лет
    page.drawText("Полных лет", {
        x: 319,
        y: 675,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем текст Семейное положение
    page.drawText("Семейное положение", {
        x: 319,
        y: 660,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем текст Пол
    page.drawText("Пол", {
        x: 319,
        y: 639,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем текст Дети на иждивении
    page.drawText("Дети на иждивении", {
        x: 319,
        y: 618,
        font: font,
        size: 11,
        color: rgb(0.52, 0.52, 0.51)
    });

    // Рисуем прямоугольник Дети на иждивении.
    page.drawRectangle({
        x: 434,
        y: 613,
        width: 148,
        height: 14,
        color: rgb(1, 1, 1)
    });

    // ######### Вписываем данные в прямоугольники #########.
    // Вписываем фамилию.
    page.drawRectangle({
        x: 152,
        y: 685,
        width: 148,
        height: 14,
        color: rgb(1, 1, 1)
    });
    page.drawText(data.fullname.secondname, {
        x: 155,
        y: 690,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // Вписываем имя.
    page.drawRectangle({
        x: 152,
        y: 672,
        width: 148,
        height: 14,
        color: rgb(0.85, 0.85, 0.85)
    });
    page.drawText(data.fullname.name, {
        x: 155,
        y: 675,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // Вписываем отчество.
    page.drawRectangle({
        x: 152,
        y: 659,
        width: 148,
        height: 14,
        color: rgb(1, 1, 1)
    });
    page.drawText(data.fullname.surname, {
        x: 155,
        y: 660,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // Вводим семейное положение.
    page.drawRectangle({
        x: 434,
        y: 657,
        width: 148,
        height: 14,
        color: rgb(1, 1, 1)
    });
    page.drawText(data.marital_status, {
        x: 437,
        y: 660,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // Вводим пол.
    page.drawRectangle({
        x: 434,
        y: 630,
        width: 122,
        height: 25,
        color: rgb(0.85, 0.85, 0.85)
    });
    page.drawText(data.gender, {
        x: 437,
        y: 639,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // Вписываем детей на иждивении.
    page.drawText(`${data.number_of_dependence}`, {
        x: 437,
        y: 617,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // Вписываем полных лет.
    page.drawRectangle({
        x: 434,
        y: 671,
        width: 122,
        height: 14,
        color: rgb(0.85, 0.85, 0.85)
    });
    page.drawText("---", {
        x: 437,
        y: 678,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // ######### Рисуем окантовку прямоугольников #########.
    // Рисуем линию под фамилией.
    page.drawLine({
        start: { x: 152, y: 686},
        end: { x: 300, y: 686}
    });

    // Рисуем линию под именем.
    page.drawLine({
        start: { x: 152, y: 671},
        end: { x: 300, y: 671}
    });

    // Рисуем линию под отчеством.
    page.drawLine({
        start: { x: 152, y: 656},
        end: { x: 300, y: 656}
    });

    // Рисуем линию под прежней фамилией.
    page.drawLine({
        start: { x: 152, y: 629},
        end: { x: 300, y: 629}
    });

    // Рисуем линию под датой рождения.
    page.drawLine({
        start: { x: 435, y: 686},
        end: { x: 555, y: 686}
    });

    // Рисуем линию под полных лет.
    page.drawLine({
        start: { x: 435, y: 671},
        end: { x: 555, y: 671}
    });

    // Рисуем линию под семейным положением.
    page.drawLine({
        start: { x: 435, y: 656},
        end: { x: 555, y: 656}
    });

    // Рисуем линию под полом.
    page.drawLine({
        start: { x: 435, y: 629},
        end: { x: 555, y: 629}
    });

    // Рисуем линию под детьми на иждивении.
    page.drawLine({
        start: { x: 435, y: 614},
        end: { x: 555, y: 614}
    });

};

async function drawTables(page, pdfDoc, propertyTableArea, incomeTableArea, data, drawTableFunc, custom_font, custom_bold_font, amountFont) {
    // Рисуем таблицу имущества.
    let current_y;
    let propertyTableData = [
        {
        'Наименование': "Наименование (описание вида имущества)",
        'Доля': "",
        'Совм': "Нет",
        'Стоимость': ""
        }
    ];

    if (data.property.length > 0) {
        propertyTableData = data.property;
    };

    data.type = "property";
    const newHeightTableProperty = await calculateTableHeight(data.property, 25, 15);
    const newTableCoordinatesProperty = { x: propertyTableArea.x, y: propertyTableArea.y2 - newHeightTableProperty, width: propertyTableArea.width, height: newHeightTableProperty};
    console.log(`Нижняя y координата таблицы property: ${newTableCoordinatesProperty.y}`);
    current_y = await drawTableFunc(page, propertyTableData, propertyTableArea.x, propertyTableArea.y1, custom_font, custom_bold_font, amountFont, data, propertyTableArea, newTableCoordinatesProperty);

    // Рисуем таблицу доходов.
    data.type = "income";
    let incomeTableData = data.sources_of_official_income;
    if (data.sources_of_official_income.length == 0) {
        incomeTableData = [
            {
                'Источник получения дохода': "источник получения дохода заёмщика",
                'Сумма в месяц': "Сумма в месяц"
            }
        ];
    };

    const newStartY = current_y - 45;
    const newHeightTableIncome = await calculateTableHeight(data.sources_of_official_income, 25, 15);
    const newTableCoordinatesIncome = { x: incomeTableArea.x, y: incomeTableArea.y2 - (newHeightTableIncome + newStartY), width: incomeTableArea.width, height: newHeightTableIncome};
    console.log(`Нижняя y координата таблицы income: ${newTableCoordinatesIncome.y}`);
    current_y = await drawTableFunc(page, incomeTableData, incomeTableArea.x, newStartY, custom_font, custom_bold_font, amountFont, data, incomeTableArea, newTableCoordinatesIncome);

    // Рисуем нижний контент.
    await draw_dawn_content_page(page, pdfDoc, data, current_y, drawTableFunc, custom_font, custom_bold_font, amountFont, newTableCoordinatesProperty, newTableCoordinatesIncome, newStartY);
};

async function draw_dawn_content_page(page, pdfDoc, data, startY, drawTableFunc, custom_font, custom_bold_font, amountFont, newTableCoordinatesProperty, newTableCoordinatesIncome, newStartY) {
    // Рисуем прямоугольник с галками.
    const monthly_income_data = {
        rectangleArea: { x: 161, y: 408, width: 276, height: 66}, // y: 492
        color: rgb(0.94, 1, 0.94),
        textColor: rgb(0, 0.58, 0.27)
    };

    const monthly_expenses_data = {
        rectangleArea: { x: 63, y: 210, width: 190, height: 40}, // y: 690
        color: rgb(1, 0.89, 0.87),
        textColor: rgb(0.7, 0.12, 0.12)
    };

    const remaining_balance_data = {
        rectangleArea: { x: 339, y: 210, width: 190, height: 40}, // y: 690,
        color: rgb(0.94, 1, 0.94),
        textColor: rgb(0, 0.58, 0.27)
    };

    // Рисуем.
    let newRectangleArea;
    newRectangleArea = {
        x: monthly_income_data.rectangleArea.x,
        y: startY - (35 + 58),
        width: monthly_income_data.rectangleArea.width,
        height: monthly_income_data.rectangleArea.height
    };

    // Рисуем прямоугольник месячных заработков.
    // Считаем доход в месяц.
    const totalSum = data.sources_of_official_income.reduce((acc, item) => acc + item["Сумма в месяц"], 0);
    let lastY;
    lastY = await drawRectangleWithCheckmarks(page, formatNumber(totalSum), newRectangleArea, monthly_income_data.color, monthly_income_data.textColor, custom_font, custom_bold_font, amountFont, true, "+");

    // Рисуем табличку.
    const expensesTableArea = {
        x: 74,
        y: lastY - 32,
        width: 482,
        height: 52
    };
    data.type = "expenses";
    const newHeightTableExpenses = await calculateTableHeight(data.monthly_expenses, 12, 12);
    const newTableCoordinatesExpenses = { x: expensesTableArea.x, y: expensesTableArea.y, width: expensesTableArea.width, height: newHeightTableExpenses};
    lastY = await drawTableFunc(page, data.monthly_expenses, expensesTableArea.x, expensesTableArea.y, custom_font, custom_bold_font, amountFont, data, expensesTableArea, newTableCoordinatesExpenses);
    

    // Рисуем остальные 2 прямоугольника.
    // Рисуем прямоугольник месячных трат.
    console.log(`lastY: ${lastY}`);
    const totalExpenses = data.monthly_expenses.reduce((acc, item) => acc + item["Сумма в месяц"], 0);
    newRectangleArea = {
        x: monthly_expenses_data.rectangleArea.x,
        y: lastY - 95,
        width: monthly_expenses_data.rectangleArea.width,
        height: monthly_expenses_data.rectangleArea.height
    };

    // Формируем массив с текстами для всех расходов.
    const expensesTexts = [
        "Регулярные ежемесячные",
        "расходы",
        "первой необходимости",
        formatNumber(totalExpenses)
    ];

    await drawRectangleWithCheckmarks(page, expensesTexts, newRectangleArea, monthly_expenses_data.color, monthly_expenses_data.textColor, custom_font, custom_bold_font, amountFont, false, "-", "expenses");

    // Рисуем прямоугольник ежемесячного профицита.
    const remaining_balance_Value = totalSum - totalExpenses;
    newRectangleArea = {
        x: remaining_balance_data.rectangleArea.x,
        y: lastY - 95,
        width: remaining_balance_data.rectangleArea.width,
        height: remaining_balance_data.rectangleArea.height
    };

    // Формируем массив с текстами для ежемесячного профицита.
    const remainingBalanceTexts = [
        "Ежемесячный профицит",
        "бюджета заемщика",
        "без учета оплат по долговым обяз-вам",
        formatNumber(remaining_balance_Value)
    ];
    await drawRectangleWithCheckmarks(page, remainingBalanceTexts, newRectangleArea, remaining_balance_data.color, remaining_balance_data.textColor, custom_font, custom_bold_font, amountFont, false, "", "remaining");

    // Рисуем пропущенные элементы.
    await draw_missing_elements(page, pdfDoc, newTableCoordinatesProperty, newTableCoordinatesIncome, newTableCoordinatesExpenses, custom_font, custom_bold_font, newStartY)
};

async function draw_missing_elements(page, pdfDoc, newTableCoordinatesProperty, newTableCoordinatesIncome, newTableCoordinatesExpenses, font, bold, newStartY) {
    // Скачиваем картирнки.
    const car_url = "https://i.ibb.co/N2wtbprH/car-image-mfpc.png";
    const bage_url = "https://i.ibb.co/jZx02yRz/bage-image-mfpc.png";

    const pngImageBytes_car = await fetch(car_url).then((res) => res.arrayBuffer())
    const pngImage_car = await pdfDoc.embedPng(pngImageBytes_car);

    const pngImageBytes_bage = await fetch(bage_url).then((res) => res.arrayBuffer())
    const pngImage_bage = await pdfDoc.embedPng(pngImageBytes_bage);

    // Размещаем картинку с машиной.
    // Вычисляем позицию последней строки таблицы property
    const carIconY = newTableCoordinatesProperty.y - (newTableCoordinatesProperty.height / 2) + 8; // Центрируем по высоте строки
    page.drawImage(pngImage_car, {
        x: newTableCoordinatesProperty.x - 34, // 10px отступа + 24px ширина иконки
        y: carIconY,
        width: 24,
        height: 20
    });

    // Рисуем линию для таблицы с имуществом.
    page.drawLine({
        start: { x: 43, y: 588},
        end: {x: 555, y: 588},
        color: rgb(0, 0, 0)
    });
    // Рисуем текст таблицы с имуществом.
    page.drawText("Информация об имуществе в собственности заемщика", {
        x: 51,
        y: 592,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // Рисуем линию для таблицы с доходами.
    page.drawLine({
        start: { x: 43, y: newStartY + 5},
        end: { x: 555, y: newStartY + 5},
        color: rgb(0, 0, 0)
    });
    // Рисуем текст таблицы с доходами.
    page.drawText("Информация об источниках официального дохода заемщика", {
        x: 51,
        y: newStartY + 10,
        font: bold,
        size: 11,
        color: rgb(0, 0, 0)
    });

    // Размещаем картинку с бейджем.
    page.drawImage(pngImage_bage, {
        x: 44,
        y: newStartY - (newTableCoordinatesIncome.height + 5) + 5,
        width: 24,
        height: 20
    });

    // Рисуем красные кружки.
    // Рисуем первый кружочек (нижний).
    page.drawCircle({
        x: 58,
        y: (newTableCoordinatesExpenses.y + 6) - newTableCoordinatesExpenses.height,
        size: 4.5,
        borderWidth: 1,
        borderColor: rgb(0.87, 0.25, 0.21),
        color: rgb(1, 0.4, 0.25),
    });

    // Рисуем второй кружочек (средний).
    page.drawCircle({
        x: 58,
        y: (newTableCoordinatesExpenses.y + 18) - newTableCoordinatesExpenses.height,
        size: 4.5,
        borderWidth: 1,
        borderColor: rgb(0.87, 0.25, 0.21),
        color: rgb(1, 0.4, 0.25),
    });

    // Рисуем третий кружочек (верхний).
    page.drawCircle({
        x: 58,
        y: (newTableCoordinatesExpenses.y + 30) - newTableCoordinatesExpenses.height,
        size: 4.5,
        borderWidth: 1,
        borderColor: rgb(0.87, 0.25, 0.21),
        color: rgb(1, 0.4, 0.25),
    });
};

async function clear_page(page) {
    const { width, height } = page.getSize();
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(1, 1, 1),
      opacity: 1,
    });
};

async function main_draw_2_page(page, pdfDoc, font, bold, amountFont, propertyTableArea, incomeTableArea, data, drawTableFunc) {
    // Стираем всю страницу.
    await clear_page(page);

    // Рисуем заголовки второй страницы.
    await draw_title_page(page, pdfDoc, font, bold);

    // Рисуем персональные данные заёмщика.
    await draw_personal_data(page, font, bold, data);

    // Рисуем таблицы.
    await drawTables(page, pdfDoc, propertyTableArea, incomeTableArea, data, drawTableFunc, font, bold, amountFont);
};