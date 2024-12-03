var gameManager = {
    // Фабрика объектов, хранящая эталонные объекты для создания
    factory: {},

    // Массив объектов на карте
    entities: [],

    // Идентификатор для уникальных объектов
    fireNum: 0,

    // Игрок
    player: null,

    // Массив для отложенного уничтожения объектов
    laterKill: [],

    level1Data: {mapPath: "assets/maps/map.json", atlasPath: "assets/sprites/spritesGame.json", atlasImg: "assets/sprites/fullsheet.png"},

    level2Data: {mapPath: "assets/maps/map2.json", atlasPath: "assets/sprites/spritesGame.json", atlasImg: "assets/sprites/fullsheet.png"},

    levelTwoSaveScore: false,

    savedScore: 0,

    // Инициализация игрока
    initPlayer: function(obj) {
        this.player = obj;
    },

    // Добавление объекта в массив для отложенного уничтожения
    kill: function(obj) {
        this.laterKill.push(obj);
    },

    // Обновление состояния игры
    update: function() {
        // Если игрок не инициализирован, выходим
        if (this.player === null) {
            setTimeout(function() {
                gameManager.update();
            }, 100);
            return;
        }

        // Сбрасываем движение игрока
        this.player.move_x = 0;
        this.player.move_y = 0;

        // Обработка событий движения игрока
        if (eventsManager.action["up"]) this.player.move_y = -16;
        if (eventsManager.action["down"]) this.player.move_y = 16;
        if (eventsManager.action["left"]) this.player.move_x = -16;
        if (eventsManager.action["right"]) this.player.move_x = 16;

        if (this.player.move_x || this.player.move_y) {

        }
        else {

        }

        //console.log("----", eventsManager.action);

        // Обработка выстрела
        //if (eventsManager.action["punch"]) this.player.punch();

        //this.entities.forEach(function (e) {
        //   if (e.name.match(/mob/)) e.activateMob();
        //});

        // Обновление всех объектов на карте
        this.entities.forEach(function(e) {
            try {
                //if (e.name === "mob") return; // отдельная обработка жвижения мобов -- иначе у игрока и моба одинаковые скорости
                e.update(); // Обновление объекта
            } catch (ex) {
                console.error(ex); // Обработка исключений
            }
        });

        // Удаление объектов, попавших в список для отложенного удаления
        for (var i = 0; i < this.laterKill.length; i++) {
            var idx = this.entities.indexOf(this.laterKill[i]);
            if (idx > -1) {
                this.entities.splice(idx, 1); // Удаление объекта из массива
            }
        }

        // Очистка списка для отложенного удаления
        if (this.laterKill.length > 0) {
            this.laterKill.length = 0;
        }

        // Отображение карты и всех объектов
        mapManager.centerAt(this.player.pos_x / mapManager.tSize.x, this.player.pos_y / mapManager.tSize.y);
        mapManager.draw(ctx);
        gameManager.draw(ctx);
    },

    // Запуск бесконечного обновления
    startUpdating: function () {
        if (this.isRunning) {
            console.warn("Обновление уже запущено.");
            return;
        }
        this.isRunning = true;
        this.updateInterval = setInterval(() => this.update(), 50);
        console.log("Обновление игры запущено.");
    },

    // Остановка обновления
    stopUpdating: function () {
        if (!this.isRunning) {
            console.warn("Обновление уже остановлено.");
            return;
        }
        clearInterval(this.updateInterval);
        this.isRunning = false;
        console.log("Обновление игры остановлено.");
    },

    // Отображение всех объектов на экране
    draw: function(ctx) {
        for (var e = 0; e < this.entities.length; e++) {
            this.entities[e].draw(ctx); // Отображение каждого объекта
        }
    },

    // Загрузка всех ресурсов игры

    loadAll: function(path_to_map, path_to_atlas, path_to_atlas_img) {
        // Загрузка карты и спрайтов
        mapManager.loadMap(path_to_map);
        spriteManager.loadAtlas(
            path_to_atlas,
            path_to_atlas_img
        );

        // Настройка менеджера событий
        eventsManager.setup(canvas);

        // Инициализация фабрики объектов
        gameManager.factory['Player'] = Player;
        gameManager.factory['Mob'] = Mob;
        gameManager.factory['Bonus'] = Bonus;
        gameManager.factory['Start'] = Start;
        gameManager.factory['End'] = End;

        // Парсинг сущностей карты
        setTimeout(() => {
            mapManager.parseEntities();
        }, 1000);
    },

    // Запуск игры
    play: function() {

        // Функция запуска игры (например, начальный цикл)
        this.loadAll(this.level1Data.mapPath, this.level1Data.atlasPath, this.level1Data.atlasImg); // Загружаем все ресурсы

        soundManager.init();
        console.log("-3");
        soundManager.loadArray([
            "sounds/login.mp3",
            "sounds/punch.mp3",
            "sounds/walkingLevel1.mp3",
            "sounds/walkingLevel2.mp3",
            "sounds/walking.mp3",
            "sounds/gotPunch.mp3",
            "sounds/loseCombat.mp3",
            "sounds/restart.mp3",
            "sounds/regener.mp3",
            "sounds/victory.mp3"
        ], () => {
            console.log("Все звуки загружены!");
            soundManager.setVolume(0.5); // Установить громкость на 50%
        });

        console.log(soundManager);
        soundManager.play("sounds/walkingLevel1.mp3", { loop: true, volume: 0.3 });


        // Запуск игрового цикла
        this.startUpdating(); // Вызываем обновление игры
    },

    restartLevel: function(dead = false) {
        saveScore();
        displayTopPlayers();

        if (!this.levelTwoSaveScore) {document.getElementById('score').innerText = 0; console.log("--------------");}
        else {
            document.getElementById('score').innerText = this.savedScore;
        }

        this.stopUpdating();

        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities.splice(i, 1);
        }
        mapManager.parseEntities();
        if (this.levelTwoSaveScore) this.entities.find(entity => entity.name === 'player').score = this.savedScore;
        if (!dead) soundManager.play("sounds/restart.mp3", {volume: 1});


        this.startUpdating();

    },

    startLevelTwo: function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveScore();
        displayTopPlayers();
        this.savedScore = this.entities.find(entity => entity.name === 'player').score;

        this.levelTwoSaveScore = true;

        this.stopUpdating();
        if (soundManager.inActiveSources("sounds/walkingLevel1.mp3")) soundManager.stopSound("sounds/walkingLevel1.mp3");

        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities.splice(i, 1);
        }

        this.loadAll(this.level2Data.mapPath, this.level2Data.atlasPath, this.level2Data.atlasImg);
        setTimeout(() => {
            gameManager.entities.find(entity => entity.name === 'player').score = this.savedScore;
        }, 100);

        mapManager.centerAt(this.player.pos_x / mapManager.tSize.x, this.player.pos_y / mapManager.tSize.y);
        this.startUpdating();

        if (!soundManager.inActiveSources("sounds/walkingLevel2.mp3")) soundManager.play("sounds/walkingLevel2.mp3", { loop: true, volume: 0.3 });
    }
};
