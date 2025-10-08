
const { PDFDocument, StandardFonts, rgb } = PDFLib;

// Данные для использования в программе.
// HEX байтовые строки.
const hexTemplate = "";
const hexFont = "";
const hexBold = "";
const amountFontBytes = "";

// Данные третьей страницы.
const amount_liabilities_data = {
    rectangleArea: { x: 62, y: 628, width: 191, height: 45}, // y: 213
    color: rgb(1, 0.89, 0.88),
    textColor: rgb(0, 0, 0)
};
const remaining_balance_data = {
    rectangleArea: { x: 62, y: 498, width: 191, height: 45}, // y: 343
    color: rgb(0.85, 0.85, 0.85),
    textColor: rgb(0, 0, 0)
};
const remaining_balance_yearly_data = {
    rectangleArea: { x: 337, y: 498, width: 191, height: 45}, // y: 343
    color: rgb(0.85, 0.85, 0.85),
    textColor: rgb(0, 0, 0)
};
const monthly_payment_data = {
    rectangleArea: { x: 337, y: 628, width: 191, height: 45}, // y: 213
    color: rgb(1, 0.89, 0.88),
    textColor: rgb(0, 0, 0)
};

// Данные первой страницы.
const fullname_data = {
    rectangleArea: { x: 210, y: 535, width: 293, height: 15}, // y: 365
    color: rgb(0.96, 0.96, 1),
    textColor: rgb(0, 0, 0)
};

// Данные четвёртой страницы.
const index_data = {
    rectangleArea: { x: 43, y: 609, width: 95, height: 50}, // y: 291
    color: rgb(0.7, 0.12, 0.12),
    textColor: rgb(1, 1, 1),
};

//________________________________________________________________________________________________________________________________________________________________
// Вспомогательные функции.
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
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

async function eraseTableArea(page, tableCoordinates, moveDistance) {
    page.drawRectangle({
        x: tableCoordinates.x - 30,
        y: tableCoordinates.y2 - (25 + moveDistance),
        width: tableCoordinates.width + 30,
        height: tableCoordinates.height,
        color: rgb(1, 1, 1)
    });
};

// Вспомогательная функция для рисования текста ежемесячного дохода
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

async function drawCenteredText(page, text, rectangleArea, font, fontSize, color, align = 'center', symbol = "", is_monthly_income = false, boldFont) {
    // Если это ежемесячный доход, используем специальное форматирование
    if (is_monthly_income) {
        return await drawMonthlyIncomeText(page, text, rectangleArea, font, boldFont, font, color, symbol);
    };
    
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

// Универсальная функция для добавления суммы в нужный прямоугольник.
async function add_amount_in_box(page, rectangleArea, amount, color, textColor, font, moveDistance, is_num=false, fontSize, align = 'center', symbol = "", is_monthly_income = false, boldFont = ""){
    // Подгоняем под текущие задачи rectangleArea.
    const newRectangleArea = {
        x: rectangleArea.x,
        y: rectangleArea.y - moveDistance,
        width: rectangleArea.width,
        height: rectangleArea.height
    };

    // Рисуем прямоугольник.
    page.drawRectangle({
        x: newRectangleArea.x,
        y: newRectangleArea.y,
        width: newRectangleArea.width,
        height: newRectangleArea.height,
        color: color
    });

    // Пишем число.
    if (is_num) {
        await drawCenteredText(
            page,
            formatNumber(amount),
            newRectangleArea,
            font,
            fontSize,
            textColor,
            align,
            symbol,
            is_monthly_income,
            boldFont
        );
    } else {
        await drawCenteredText(
        page,
        amount,
        newRectangleArea,
        font,
        fontSize,
        textColor,
        align,
        symbol,
        is_monthly_income,
        boldFont
    );
    }
};

async function calculate_index(remaining_balance) {
    let index = 0;
    if (remaining_balance >= 100000) {
        index = 669;
    } else if (remaining_balance >= 50000) {
        index = 583;
    } else if (remaining_balance >= 20000) {
        index = 511;
    } else if (remaining_balance >= 5000) {
        index = 419;
    } else if (remaining_balance >= 0) {
        index = 366;
    } else {
        index = 147;
    }
    return index;
};

// Функции для работы с таблицей "Информация о финансовых обязательствах заёмщика".
//________________________________________________________________________________________________________________________________________________________________
// Функция для добавления синего кружочка и черточки с названием таблицы и добавления данных в прямоугольники.
async function add_blue_circle_and_line_with_name_table(page, custom_bold_font, table_data, amountFont, newTableCordinates, moveDistance) {
    // Вводим данные в прямоугольники.
    console.log(`table_data.length: ${table_data.liabilities.length}`);
    console.log('typeof table_data:', typeof table_data);

    // Добавляем смещение вверх, если в таблице с обязательствами 1 ед данных.
    let offset = 0;
    if (table_data.liabilities.length == 1) {
        offset = 10;
    };

    if (table_data.liabilities.length == 0) {
        offset = -20;
    };

    // Вводим общую сумму по обязательствам.
    const totalLiabilities = table_data.liabilities && table_data.liabilities.length > 0 
        ? table_data.liabilities.reduce((acc, item) => acc + item["Общая сумма обязательства"], 0)
        : 0;

    const totalIncome = table_data.sources_of_official_income && table_data.sources_of_official_income.length > 0
        ? table_data.sources_of_official_income.reduce((acc, item) => acc + item["Сумма в месяц"], 0)
        : 0;

    const monthlyPayment = table_data.liabilities && table_data.liabilities.length > 0
        ? table_data.liabilities.reduce((acc, item) => acc + item["Ежемесячный платеж"], 0)
        : 0;

    const totalExpenses = table_data.monthly_expenses && table_data.monthly_expenses.length > 0
        ? table_data.monthly_expenses.reduce((acc, item) => acc + item["Сумма в месяц"], 0)
        : 0;
    const remainingBalanceValue = totalIncome - (totalExpenses + monthlyPayment);

    // Вводим общую сумму обязательств.
    await add_amount_in_box(
        page,
        amount_liabilities_data.rectangleArea,
        totalLiabilities,
        amount_liabilities_data.color,
        amount_liabilities_data.textColor,
        amountFont,
        moveDistance - offset,
        true,
        28
    );

    // Вводим ежемесячный профицит.
    await add_amount_in_box(
        page,
        remaining_balance_data.rectangleArea,
        remainingBalanceValue,
        remaining_balance_data.color,
        remaining_balance_data.textColor,
        amountFont,
        moveDistance - offset,
        true,
        28
    );

    // Вводим ежемесячную оплату.
    await add_amount_in_box(
        page,
        monthly_payment_data.rectangleArea,
        monthlyPayment,
        monthly_payment_data.color,
        monthly_payment_data.textColor,
        amountFont,
        moveDistance - offset,
        true,
        28
    );

    // Вводим годовой профицит.
    await add_amount_in_box(
        page,
        remaining_balance_yearly_data.rectangleArea,
        remainingBalanceValue * 12,
        remaining_balance_yearly_data.color,
        remaining_balance_yearly_data.textColor,
        amountFont,
        moveDistance - offset,
        true,
        28,
    );
};

// Основные функции для работы с таблицами.
//________________________________________________________________________________________________________________________________________________________________
// Функция для подсчёта высоты, на которую выросал страница.
async function calculateTableHeight(tableData, headerRowHeight = 25, dataRowHeight = 15) {
    return headerRowHeight + (tableData.length * dataRowHeight);
};

// Функция для смещения контента вниз от таблицы.
async function moveContentDown(page, tableArea, newTableArea, moveDistance, pdfDoc, amountFont, bold, tableData) {
    if (moveDistance <= 0) {
        // Заполняем все данные кроме таблицы.
        //await add_blue_circle_and_line_with_name_table(page, bold, tableData, amountFont, newTableArea, moveDistance);
        return;
    };
    
    const pageHeight = page.getHeight();
    const pageWidth = page.getWidth();

    // Стираем изначальную таблицу.
    //await eraseTableArea(page, tableArea, moveDistance)
    
    // 1. Копируем оригинальную страницу
    const tempDoc = await PDFDocument.create();
    const [originalPage] = await tempDoc.copyPages(pdfDoc, [pdfDoc.getPages().indexOf(page)]);
    tempDoc.addPage(originalPage);

    // 2. Загружаем копию страницы для извлечения контента
    const contentBytes = await tempDoc.save();
    const contentDoc = await PDFDocument.load(contentBytes);
    const [contentPage] = await pdfDoc.copyPages(contentDoc, [0]);
    const embeddedPage = await pdfDoc.embedPage(contentPage);

    // 3. Стираем всю страницу
    page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(1, 1, 1),
        opacity: 1
    });

    // Верхние элементы.
    const contentAboveHeight = pageHeight - tableArea.y1;
    page.drawPage(embeddedPage, {
        x: 0,
        y: pageHeight - contentAboveHeight - 4, // Начинаем с верха страницы
        width: pageWidth,
        height: contentAboveHeight,
        // Обрезаем: показываем только часть выше таблицы
        srcPage: contentPage,
        srcRect: {
            x: 0, 
            y: tableArea.y1, 
            width: pageWidth, 
            height: contentAboveHeight
        }
    });

    // Нижние элементы.
    const contentBelowHeight = tableArea.y2 + 33;
    page.drawPage(embeddedPage, {
        x: 0,
        y: -moveDistance, // Смещаем ВНИЗ (уменьшаем Y)
        width: pageWidth,
        height: contentBelowHeight,
        srcRect: {
            x: 0, 
            y: 0, // Берем от низа страницы
            width: pageWidth, 
            height: tableArea.y2
        }
    });

    // Затираем ненужную часть.
    page.drawRectangle({
        x: 20,
        y: newTableArea.y + 8,
        width: 55,
        height: (tableArea.height + moveDistance) - 20,
        color: rgb(1, 1, 1)
    });
};

async function drawTable(page, tableData, x, startY, custom_font, custom_bold_font, amountFont, tableTypeData, tableCoordinates, newTableCoordinates) {
    // Проверяем не пустой-ли список с новыми данными таблицы.
    if (tableData.length == 0) {
        return startY;
    };

    // Если список не пустой, то рискем табличку.
    let headerRowHeight = 13;
    let dataRowHeight = 0;
    let borderWidth = 0;
    let headers = [];
    let colWidths = [];
    let totalTableWidth = 0;
    
    if (tableTypeData.type == "income") {
        dataRowHeight = 20;
        borderWidth = 0.75;
        headers = ["Источник получения дохода", "Сумма в месяц"]
        colWidths = [346, 136];
        totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    } else if (tableTypeData.type == "property") {
        dataRowHeight = 20;
        borderWidth = 0.75;
        headers = ["Наименование", "Доля", "Совм", "Стоимость"]
        colWidths = [253, 47, 47, 135];
        totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    } else if (tableTypeData.type == "expenses") {
        dataRowHeight = 12;
        borderWidth = 0.75;
        headers = ["Вид расходов", "Сумма в месяц"]
        colWidths = [346, 136]
        totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    }else {
        dataRowHeight = 15;
        borderWidth = 0.75;
        headers = ['Вид обязательства', 'Ежемесячный платеж', 'Общая сумма обязательства'];
        colWidths = [253, 96, 136];
        headerRowHeight = 40;
        totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0);
    };
    
    // Функция для переноса текста
    function wrapText(text, font, fontSize, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + ' ' + word;
            const testWidth = font.widthOfTextAtSize(testLine, fontSize);

            if (testWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

    // === ВЫЧИСЛЕНИЕ ВЫСОТЫ ТАБЛИЦЫ ===
    let currentY = startY;
    
    // Вычисляем высоту шапки
    let maxLines = 1;
    const headerLines = headers.map((header, colIndex) => {
        const maxTextWidth = colWidths[colIndex] - 10;
        const lines = wrapText(header, custom_bold_font, 12, maxTextWidth);
        maxLines = Math.max(maxLines, lines.length);
        return lines;
    });


    //headerRowHeight = 10 + (maxLines * 12);
    const totalTableHeight = headerRowHeight + (tableData.length * dataRowHeight);

    // === РИСОВАНИЕ ШАПКИ ТАБЛИЦЫ ===
    let currentX = x;

    // Фон шапки
    page.drawRectangle({
        x: x,
        y: currentY - headerRowHeight,
        width: totalTableWidth,
        height: headerRowHeight,
        color: rgb(1, 1, 1),
    });

    // Заголовки шапки с переносами
    headers.forEach((header, colIndex) => {
        const lines = headerLines[colIndex];
        const lineHeight = 12;
        
        // Рисуем каждую строку заголовка
        lines.forEach((line, lineIndex) => {
            let totalTextHeight;
            let textY;
            
            const textWidth = custom_bold_font.widthOfTextAtSize(line, 10);
            const textX = currentX + (colWidths[colIndex] - textWidth) / 2;
            if (tableTypeData.type == "liability") {
                // Вертикальное центрирование для многострочного текста
                totalTextHeight = lines.length * lineHeight;
                textY = currentY - headerRowHeight + (headerRowHeight - totalTextHeight) / 2 + (lines.length - lineIndex - 1) * lineHeight;
            } else {
                // Вертикальное центрирование для многострочного текста
                totalTextHeight = lines.length * lineHeight;
                textY = currentY - headerRowHeight + (headerRowHeight - totalTextHeight) / 2 + (lines.length - lineIndex - 1) * lineHeight + 3;
            }
            
            page.drawText(line, {
                x: textX,
                y: textY,
                size: 10,
                font: custom_bold_font,
                color: rgb(0, 0, 0),
            });
        });

        // Границы ячеек шапки
        page.drawRectangle({
            x: currentX,
            y: currentY - headerRowHeight,
            width: colWidths[colIndex],
            height: headerRowHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: borderWidth,
        });

        currentX += colWidths[colIndex];
    });

    // === РИСОВАНИЕ ДАННЫХ ТАБЛИЦЫ ===
    currentY -= headerRowHeight; // перемещаемся ниже шапки

    tableData.forEach((row, rowIndex) => {
        currentX = x;

        // Фон строки
        page.drawRectangle({
            x: currentX,
            y: currentY - dataRowHeight,
            width: totalTableWidth,
            height: dataRowHeight,
            color: rgb(1, 1, 1),
        });

        // Данные ячеек
        headers.forEach((header, colIndex) => {
            const cellValue = formatNumber(row[header]) ?? "";
            
            // Выравнивание текста
            let textX = currentX + 5;
            let textAlign = 'left';
            
            // Для числовых столбцов выравнивание по правому краю
            if (header === 'Ежемесячный платеж' || header === 'Общая сумма обязательства' || header === 'Сумма в месяц' || header === 'Стоимость') {
                const textWidth = custom_font.widthOfTextAtSize(cellValue, 10);
                textX = currentX + colWidths[colIndex] - textWidth - 5;
                textAlign = 'right';
            }

            // Проверяем, не выходит ли текст за границы
            const textWidth = custom_font.widthOfTextAtSize(cellValue, 10);
            if (textWidth > colWidths[colIndex] - 10) {
                // Если текст слишком длинный, уменьшаем шрифт или обрезаем
                const maxWidth = colWidths[colIndex] - 10;
                const lines = wrapText(cellValue, custom_font, 10, maxWidth);
                
                lines.forEach((line, lineIndex) => {
                    let lineX = textX;
                    if (textAlign === 'right') {
                        const lineWidth = custom_font.widthOfTextAtSize(line, 10);
                        lineX = currentX + colWidths[colIndex] - lineWidth - 5;
                    }
                    
                    page.drawText(line, {
                        x: lineX,
                        y: currentY - dataRowHeight + 3 - (lineIndex * 8),
                        size: 10,
                        font: custom_font,
                        color: rgb(0, 0, 0),
                    });
                });
            } else {
                page.drawText(cellValue, {
                    x: textX,
                    y: currentY - dataRowHeight + 3,
                    size: 10,
                    font: custom_font,
                    color: rgb(0, 0, 0),
                });
            }

            // Границы ячеек данных
            page.drawRectangle({
                x: currentX,
                y: currentY - dataRowHeight,
                width: colWidths[colIndex],
                height: dataRowHeight,
                borderColor: rgb(0, 0, 0),
                borderWidth: borderWidth,
            });

            currentX += colWidths[colIndex];
        });

        currentY -= dataRowHeight; // перемещаемся вниз для следующей строки
    });

    // Внешняя граница всей таблицы
    page.drawRectangle({
        x: x,
        y: startY - totalTableHeight,
        width: totalTableWidth,
        height: totalTableHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: borderWidth,
    });

    // Возвращаем новую позицию Y (верхнюю границу следующей таблицы)
    const newStartY = startY - totalTableHeight;

    if (tableTypeData.type == "liability") {
        await add_blue_circle_and_line_with_name_table(page, custom_bold_font, tableTypeData, amountFont, newTableCoordinates, tableData.length * 15);
    };

    // Возвращаем новую позицию Y для следующей таблицы
    return newStartY;
};

// Основная функция для замены таблицы
async function replaceTableInPDF(page, newTableData, tableCoordinates, tableData, pdfDoc, custom_bold_font, custom_font, amountFont) {
    // Считаем на сколько надо сместить элементы вниз под таблицей.
    // Получаем новую высоту таблицы.
    const newHeightTable = await calculateTableHeight(newTableData, 25, 15);

    // Считаем разницу.
    const height_difference = newHeightTable - tableCoordinates.height;

    const newTableY = tableCoordinates.y2 - height_difference;

    // Перемещаем контент под таблицу.
    const newTableCoordinates = { x: tableCoordinates.x, y: tableCoordinates.y2 - newHeightTable, width: tableCoordinates.width, height: newHeightTable}
    await moveContentDown(page, tableCoordinates, newTableCoordinates, height_difference, pdfDoc, amountFont, custom_bold_font, tableData);
    
    // Рисование новой таблицы
    await drawTable(page, newTableData, tableCoordinates.x, (tableCoordinates.y2 - tableCoordinates.height) + 26, custom_font, custom_bold_font, amountFont, tableData, { ...tableCoordinates, height: newHeightTable, y: newTableY}, newTableCoordinates);
};

async function main_function(data) {
    // Преобразуем шрифты и PDF шаблон из hex в ArrayBuffer.
    const fontBytes = hexToBytes(hexFont);
    const fontBoldBytes = hexToBytes(hexBold);
    const fomtAmountBytes = hexToBytes(amountFontBytes);
    const existingPdfBytes = hexToBytes(hexTemplate);

    // Чтение существующего PDF
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDoc.getPages();

    // Устанавливаем шрифты.
    let custom_font;
    let custom_bold_font;
    let amountFont;
    if (fomtAmountBytes) {
        pdfDoc.registerFontkit(fontkit);
        await pdfDoc.embedFont(fomtAmountBytes);
        amountFont = await pdfDoc.embedFont(fomtAmountBytes);
    };
    if (fontBytes) {
        pdfDoc.registerFontkit(fontkit);
        await pdfDoc.embedFont(fontBytes);
        custom_font = await pdfDoc.embedFont(fontBytes);
    };
    if (fontBoldBytes) {
        pdfDoc.registerFontkit(fontkit);
        await pdfDoc.embedFont(fontBoldBytes);
        custom_bold_font = await pdfDoc.embedFont(fontBoldBytes);
    };

    //######### Основная часть #########
    // Добавляем ФИО | Page 1.
    // Собираем фио из данных таблицы.
    fullname = `${data.fullname.secondname} ${data.fullname.name} ${data.fullname.surname}`;
    await add_amount_in_box(
        pages[0],
        fullname_data.rectangleArea,
        fullname,
        fullname_data.color,
        fullname_data.textColor,
        custom_font,
        60,
        false,
        14,
        "left"
    );

    // Добавляем индекс | Page 4.
    // Считаем индекс.
    const totalIncome = data.sources_of_official_income.reduce((acc, item) => acc + item["Сумма в месяц"], 0);
    const totalExpenses = data.monthly_expenses.reduce((acc, item) => acc + item["Сумма в месяц"], 0);
    const remaining_balance_value = totalIncome - totalExpenses;
    const index = await calculate_index(remaining_balance_value);
    await add_amount_in_box(
        pages[3],
        index_data.rectangleArea,
        index,
        index_data.color,
        index_data.textColor,
        custom_bold_font,
        60,
        false,
        36
    );

    const propertyTableArea = {
        x: 74,
        y1: 581,
        y2: 601,
        width: 490,
        height: 45
    };

    const incomeTableArea = {
        x: 74,
        y1: 481,
        y2: 501,
        width: 486,
        height: 40
    };

    await main_draw_2_page(pages[1], pdfDoc, custom_font, custom_bold_font, amountFont, propertyTableArea, incomeTableArea, data, drawTable);

    // Работает с таблицей "Информация о финансовых обязательствах заемщика". | Page 3
    data.type = "liability"
    const liabliityTableArea = {
        x: 74,
        y1: 60,
        y2: 796, // 780
        width: 486,
        height: 40
    };
    await replaceTableInPDF(pages[2], data.liabilities, liabliityTableArea, data, pdfDoc, custom_bold_font, custom_font, amountFont);

    // Сохраняем PDF.
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    /*
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`PDF обновлен: ${outputPath}`);
    */
};