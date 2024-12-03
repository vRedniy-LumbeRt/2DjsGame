// Сохранение имени пользователя в localStorage
function storeUsername() {
    const username = document.getElementById('usernameInput').value;
    if (!localStorage.getItem(username)) {
        localStorage.setItem(username, 0);
    }
}

// Чтение имени пользователя
function readUsername() {
    const storedUsername = document.getElementById('usernameInput').value;
    if (storedUsername) {

        document.getElementById('currentUser').innerText = storedUsername;
    }
}

// Показ игры
function showGame() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    document.getElementById('topTable').style.display = 'block';
    document.getElementById('info_text').style.display = 'block';

    readUsername();
    displayTopPlayers(); // Загрузка топ-7 игроков в таблицу
}

// Чтение и отображение топ-3 игроков
function displayTopPlayers() {
    const players = [];

    // Получаем всех игроков из localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const score = parseInt(localStorage.getItem(key), 10);
        players.push({ name: key, score: score });
    }

    // Сортируем по убыванию счёта с помощью компаратора
    players.sort((a, b) => b.score - a.score);

    // Оставляем только топ-7
    const topPlayers = players.slice(0, 7);

    // Вставляем их в таблицу (querySelector ищет первый элемент в дереве DOM, соответствующий заданному селектору)
    const tbody = document.querySelector('#topTable tbody');
    tbody.innerHTML = ''; // Очищаем предыдущие данные

    topPlayers.forEach(player => {
        const row = document.createElement('tr'); // Создание строки
        row.innerHTML = `<td>${player.name}</td><td>${player.score}</td>`; // Вставка в две клетки строки
        tbody.appendChild(row); // Добавление строки в таблицу
    });
}

// Функция завершения игры
function saveScore() {

    // Запись о счёте в localStorage
    let score = gameManager.entities.find(entity => entity.name === 'player').score;
    console.log(score, "555555555");
    if (localStorage.getItem(document.getElementById('usernameInput').value) < score){
        localStorage.setItem(document.getElementById('usernameInput').value, score);
    }
}

