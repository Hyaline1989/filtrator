// ФУНКЦИИ ФИЛЬТРАЦИИ С УЧЕТОМ АКТУАЛЬНЫХ ВАКАНСИЙ
function filterAndDisplayObjects() {
    const ageInput = document.getElementById('age');
    const genderSelect = document.getElementById('gender');
    const nationalitySelect = document.getElementById('nationality');
    const convictionSelect = document.getElementById('hasConviction');
    const resultsContainer = document.getElementById('results');
    const resultsCount = document.getElementById('resultsCount');

    const selectedAge = parseInt(ageInput.value);
    const selectedGender = genderSelect.value;
    const selectedNationality = nationalitySelect.value;
    const selectedHasConviction = convictionSelect.value === 'true';

    const filteredObjects = objects.filter(obj => {
        if (!obj.visible) return false;
        
        // Базовые критерии фильтрации
        const ageMatch = selectedAge >= obj.ageMin && selectedAge <= obj.ageMax;
        const genderMatch = obj.allowedGenders.includes(selectedGender);
        const nationalityMatch = obj.allowedNationalities.includes(selectedNationality);
        let convictionMatch;
        if (selectedHasConviction) {
            convictionMatch = obj.allowsConviction === true;
        } else {
            convictionMatch = true;
        }

        // Проверяем базовые критерии
        if (!ageMatch || !genderMatch || !nationalityMatch || !convictionMatch) {
            return false;
        }

        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: есть ли актуальные вакансии для выбранного пола
        const vacancyStats = getVacancyStats(obj.name);
        
        if (selectedGender === 'мужчина' && vacancyStats.men === 0) {
            return false; // Нет вакансий для мужчин
        }
        
        if (selectedGender === 'женщина' && vacancyStats.women === 0) {
            return false; // Нет вакансий для женщин
        }

        return true;
    });

    displayResults(filteredObjects, resultsContainer, resultsCount);
}

function displayResults(objectsToDisplay, resultsContainer, resultsCount) {
    resultsContainer.innerHTML = '';
    
    const sortedObjects = objectsToDisplay.sort((a, b) => {
        if (a.priority && !b.priority) return -1;
        if (!a.priority && b.priority) return 1;
        
        const indexA = globalOrder.indexOf(a.id);
        const indexB = globalOrder.indexOf(b.id);
        return indexA - indexB;
    });

    const priorityCount = sortedObjects.filter(obj => obj.priority).length;
    const totalCount = sortedObjects.length;
    
    // Добавляем информацию о фильтрации по вакансиям
    const selectedGender = document.getElementById('gender').value;
    let vacancyFilterInfo = '';
    if (selectedGender === 'мужчина') {
        vacancyFilterInfo = ' (показаны только объекты с вакансиями для мужчин)';
    } else if (selectedGender === 'женщина') {
        vacancyFilterInfo = ' (показаны только объекты с вакансиями для женщин)';
    }
    
    resultsCount.textContent = `Найдено объектов: ${totalCount} (${priorityCount} в приоритете)${vacancyFilterInfo}`;

    if (sortedObjects.length === 0) {
        const selectedGender = document.getElementById('gender').value;
        let noResultsMessage = '❌ По заданным критериям объектов не найдено. Попробуйте изменить параметры фильтра.';
        
        // Специальное сообщение если нет вакансий для выбранного пола
        if (selectedGender === 'женщина') {
            const objectsWithWomen = objects.filter(obj => 
                obj.visible && 
                obj.allowedGenders.includes('женщина') &&
                !objectsToDisplay.includes(obj)
            );
            if (objectsWithWomen.length > 0) {
                noResultsMessage = '❌ На данных объектах сейчас нет вакансий для женщин. Попробуйте выбрать другой пол или проверьте позже.';
            }
        } else if (selectedGender === 'мужчина') {
            const objectsWithMen = objects.filter(obj => 
                obj.visible && 
                obj.allowedGenders.includes('мужчина') &&
                !objectsToDisplay.includes(obj)
            );
            if (objectsWithMen.length > 0) {
                noResultsMessage = '❌ На данных объектах сейчас нет вакансий для мужчин. Попробуйте выбрать другой пол или проверьте позже.';
            }
        }
        
        resultsContainer.innerHTML = `<div class="no-results">${noResultsMessage}</div>`;
    } else {
        sortedObjects.forEach((obj, index) => {
            const vacancyStats = getVacancyStats(obj.name);
            const card = document.createElement('div');
            card.className = `object-card ${obj.priority ? 'priority-card' : ''}`;
            card.setAttribute('data-id', obj.id);
            
            const orderNumber = currentAccessLevel === "admin" ? `<span class="order-badge">${index + 1}</span>` : '';
            const dragHandle = currentAccessLevel === "admin" ? '<div class="drag-handle-main">⋮⋮</div>' : '';
            
            card.innerHTML = `
                ${dragHandle}
                ${obj.priority ? '<div class="priority-badge">🚀 В приоритете</div>' : ''}
                <h3>${orderNumber}<a href="${obj.link}" target="_blank">${obj.name}</a></h3>
                
                <div class="vacancy-stats">
                    <div class="vacancy-stat">
                        <div class="vacancy-value vacancy-men">${vacancyStats.men}</div>
                        <div class="vacancy-label">Мужчины</div>
                    </div>
                    <div class="vacancy-stat">
                        <div class="vacancy-value vacancy-women">${vacancyStats.women}</div>
                        <div class="vacancy-label">Женщины</div>
                    </div>
                    <div class="vacancy-stat">
                        <div class="vacancy-value vacancy-family">${vacancyStats.family}</div>
                        <div class="vacancy-label">Семьи</div>
                    </div>
                </div>
                
                ${debugMode ? `<div style="font-size: 10px; color: #666; margin-top: 5px;">Источник: ${vacancyStats.rawName || 'не найден'}</div>` : ''}
                
                <p><strong>Возраст:</strong> ${obj.ageMin} - ${obj.ageMax} лет</p>
                <p><strong>Пол:</strong> ${obj.allowedGenders.join(', ')}</p>
                <p><strong>Гражданство:</strong> ${obj.allowedNationalities.join(', ')}</p>
                <p><strong>Судимость:</strong> ${obj.allowsConviction ? '✅ Принимают' : '❌ Не принимают'}</p>
                <div class="link">
                    <a href="${obj.link}" target="_blank">📊 Открыть таблицу с вакансиями →</a>
                </div>
            `;
            resultsContainer.appendChild(card);
        });
    }
}