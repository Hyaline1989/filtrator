// ФУНКЦИИ ДЛЯ РАБОТЫ С GOOGLE SHEETS
async function loadVacancyData() {
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}&range=${SHEET_RANGE}`;
        
        let response;
        try {
            response = await fetch(url);
            if (!response.ok) throw new Error('Direct fetch failed');
        } catch (err) {
            response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        }
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        const json = JSON.parse(text.substring(47).slice(0, -2));
        
        vacancyData = {};
        
        // ТОЧНЫЕ ПРАВИЛА СОПОСТАВЛЕНИЯ
        const mappingRules = {
            // Спортмастер СПБ - должен содержать "спб" или "питер" или "санкт-петербург"
            'спортмастер спб': 'Спортмастер СПБ',
            'спортмастер санкт-петербург': 'Спортмастер СПБ',
            'спортмастер питер': 'Спортмастер СПБ',
            'спб спортмастер': 'Спортмастер СПБ',
            
            // Обычный Спортмастер (без указания города) - это основной Спортмастер
            'спортмастер': 'Спортмастер',
            
            // Мираторг Брянск - это просто "Мираторг" без указания города
            'мираторг': 'Мираторг Брянск',
            
            // Мираторг Тула - должен содержать "тула"
            'мираторг тула': 'Мираторг Тула',
            'тула мираторг': 'Мираторг Тула'
        };
        
        json.table.rows.forEach((row, index) => {
            if (row.c && row.c.length > 0 && row.c[0] && row.c[0].v) {
                const rawName = row.c[0].v.toString().trim();
                const cleanName = rawName.toLowerCase();
                
                let matchedObject = null;
                
                // ПРИОРИТЕТНОЕ СОПОСТАВЛЕНИЕ ПО ПРАВИЛАМ
                // Сначала ищем точные совпадения с учетом приоритета
                if (cleanName.includes('спб') || cleanName.includes('питер') || cleanName.includes('санкт-петербург')) {
                    matchedObject = objectsBase.find(obj => obj.name === 'Спортмастер СПБ');
                }
                else if (cleanName.includes('тула') && cleanName.includes('мираторг')) {
                    matchedObject = objectsBase.find(obj => obj.name === 'Мираторг Тула');
                }
                else if (cleanName === 'спортмастер') {
                    matchedObject = objectsBase.find(obj => obj.name === 'Спортмастер');
                }
                else if (cleanName === 'мираторг') {
                    matchedObject = objectsBase.find(obj => obj.name === 'Мираторг Брянск');
                }
                
                // Если не нашли по приоритетным правилам, ищем обычным способом
                if (!matchedObject) {
                    matchedObject = objectsBase.find(obj => {
                        const objNameLower = obj.name.toLowerCase();
                        // Точное совпадение или частичное вхождение
                        return cleanName === objNameLower || 
                               cleanName.includes(objNameLower) || 
                               objNameLower.includes(cleanName);
                    });
                }
                
                if (matchedObject) {
                    const menValue = row.c[1] ? (parseInt(row.c[1].v) || 0) : 0;
                    const womenValue = row.c[2] ? (parseInt(row.c[2].v) || 0) : 0;
                    const familyValue = row.c[3] ? (parseInt(row.c[3].v) || 0) : 0;
                    
                    vacancyData[matchedObject.name] = {
                        men: menValue,
                        women: womenValue,
                        family: familyValue,
                        rawName: rawName
                    };
                    
                    console.log(`✅ Сопоставлено: "${rawName}" -> "${matchedObject.name}"`);
                } else {
                    console.log(`❌ Не найдено сопоставление для: "${rawName}"`);
                }
            }
        });
        
        // Заполняем нулями объекты, для которых не нашли данные
        objectsBase.forEach(obj => {
            if (!vacancyData[obj.name]) {
                vacancyData[obj.name] = {
                    men: 0,
                    women: 0,
                    family: 0,
                    rawName: 'Не найдено в таблице'
                };
                console.log(`⚠️ Объект не найден в таблице: "${obj.name}"`);
            }
        });
        
        return vacancyData;
    } catch (err) {
        console.error('Ошибка загрузки данных о вакансиях:', err);
        objectsBase.forEach(obj => {
            vacancyData[obj.name] = {
                men: 0,
                women: 0,
                family: 0,
                rawName: 'Ошибка загрузки'
            };
        });
        return vacancyData;
    }
}

function getVacancyStats(objectName) {
    if (vacancyData[objectName]) {
        return vacancyData[objectName];
    }
    return { men: 0, women: 0, family: 0, rawName: 'Не найдено' };
}