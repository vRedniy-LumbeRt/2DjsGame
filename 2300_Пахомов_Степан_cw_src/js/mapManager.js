let mapManager = {
    mapData: null,
    tLayers: [], // Массив для хранения всех слоев
    xCount: 0,
    yCount: 0,
    tSize: { x: 0, y: 0 },
    mapSize: { x: 0, y: 0 },
    tilesets: [],
    view: {},
    scale: 0,
    scaledTileWidth: 0,
    scaledTileHeight: 0,

    // Загрузка карты
    loadMap: function (path) {
        const request = new XMLHttpRequest();
        request.open("GET", path, true);
        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status === 200) {
                mapManager.parseMap(JSON.parse(request.responseText));
            }
        };
        request.send();
    },

    // Разбор карты
    parseMap: function (tilesJSON) {
        this.mapData = tilesJSON;
        this.xCount = tilesJSON.width;
        this.yCount = tilesJSON.height;
        this.tSize = { x: tilesJSON.tilewidth, y: tilesJSON.tileheight };
        this.scale = 3;
        this.scalesList = {1: {w: 60, h: 60}, 2: {w: 30, h: 30}, 3: {w: 20, h: 20}};
        this.mapSize = {
            x: this.xCount * this.tSize.x * this.scale,
            y: this.yCount * this.tSize.y * this.scale
        };

        this.scaledTileWidth = this.tSize.x * this.scale;
        this.scaledTileHeight = this.tSize.y * this.scale;

        //this.view = { x: 1728, y: 816, w: 960, h: 960 };
        this.view = {
            x: 0 * this.scaledTileWidth,
            y: 0 * this.scaledTileHeight,
            w: this.scalesList[this.scale].w * this.scaledTileWidth,
            h: this.scalesList[this.scale].h * this.scaledTileHeight
        };

        // Парсинг всех слоев (не только tilelayer)
        this.tLayers = tilesJSON.layers.filter(layer => layer.type === 'tilelayer');
        if (this.tLayers.length === 0) {
            console.error("Не найдено слоев типа 'tilelayer'");
            return;
        }

        // Парсинг тайлсетов
        tilesJSON.tilesets.forEach(tileset => {
            tileset.source = tileset.image.replace("png", "tsx")
            this.loadTilesetImage(tileset.source, tileset.firstgid);
        });
    },

    isVisibleSprite: function (x, y) {
        if (x < 0 || y  < 0 || x >= this.view.w || y >= this.view.h) {
            return false;
        }
        return true;
    },

    // Разбор объектов слоя objectgroup
    parseEntities: function () {
        if (!this.mapData) {
            console.error("Данные карты не загружены");
            return;
        }

        for (let j = 0; j < this.mapData.layers.length; j++) {
            const layer = this.mapData.layers[j];
            if (layer.type === 'objectgroup') {
                const entities = layer.objects;
                for (let i = 0; i < entities.length; i++) {
                    const e = entities[i];
                    try {
                        // Определяем тип объекта на основе имени
                        let entityClass;
                        if (e.name === "player") {
                            entityClass = gameManager.factory['Player'];
                        } else if (e.name === "StartPoint") {
                            entityClass = gameManager.factory['Start'];
                        } else if (e.name === "EndPoint") {
                            entityClass = gameManager.factory['End'];
                        } else if (e.name.match(/mob_\d+/)) {
                            entityClass = gameManager.factory['Mob'];
                        } else if (e.name.match(/health\d+/)) {
                            entityClass = gameManager.factory['Bonus'];
                        } else {
                            console.warn(`Неизвестный объект: ${e.name}`);
                            continue;
                        }

                        // Создаем объект соответствующего класса
                        const obj = new entityClass(e.x, e.y, e.width, e.height);
                        console.log("Объект создан:", obj);

                        // Добавление объекта в список сущностей
                        gameManager.entities.push(obj);

                        // Инициализация игрока
                        if (obj.name === "player") {
                            gameManager.initPlayer(obj);
                            //mapManager.centerAt(Math.floor(obj.pos_x / this.tSize.x) , Math.floor(obj.pos_y / this.tSize.y));
                        }

                    } catch (ex) {
                        console.error(`Ошибка при создании объекта [${e.gid}] ${e.name}:`, ex);
                    }
                }
            }
        }
        try{
            gameManager.entities.find(entity => entity.name === 'player').pos_x = gameManager.entities.find(entity => entity.name === 'start').pos_x;
            gameManager.entities.find(entity => entity.name === 'player').pos_y = gameManager.entities.find(entity => entity.name === 'start').pos_y;
        }
        catch (error) {
            console.error(error);
        }

    },

    // Центрирование карты на заданных координатах
    centerAt: function (x, y) {
        if (x * this.scaledTileWidth < this.view.w / 2) {
            this.view.x = 0;
        } else if (x * this.scaledTileWidth > this.mapSize.x - this.view.w / 2) {
            this.view.x = this.mapSize.x - this.view.w;
        } else {
            this.view.x = x * this.scaledTileWidth - this.view.w / 2;
        }

        if (y * this.scaledTileHeight < this.view.h / 2) {
            this.view.y = 0;
        } else if (y * this.scaledTileHeight > this.mapSize.y - this.view.h / 2) {
            this.view.y = this.mapSize.y - this.view.h;
        } else {
            this.view.y = y * this.scaledTileHeight - this.view.h / 2;
        }


        //console.log(`Карта центрирована: x=${this.view.x}, y=${this.view.y}`);
    },

    // Функция для загрузки изображения из tileset и создания объекта
    loadTilesetImage: function (tilesetSource, firstgid) {
        const tilesetRequest = new XMLHttpRequest();
        tilesetRequest.open("GET", "assets/" + tilesetSource.slice(2), true);
        tilesetRequest.onreadystatechange = () => {
            if (tilesetRequest.readyState === 4 && tilesetRequest.status === 200) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(tilesetRequest.responseText, "application/xml");
                const imageSource = xmlDoc.getElementsByTagName("image")[0].getAttribute("source");
                const imgWidth = parseInt(xmlDoc.getElementsByTagName("image")[0].getAttribute("width"));
                const imgHeight = parseInt(xmlDoc.getElementsByTagName("image")[0].getAttribute("height"));

                // Загружаем само изображение
                const img = new Image();
                img.src = "assets/tilesets/" + imageSource;
                img.onload = () => {
                    this.tilesets.push({
                        firstgid: firstgid,
                        img: img,
                        xCount: Math.floor(imgWidth / this.tSize.x),
                        yCount: Math.floor(imgHeight / this.tSize.y)
                    });
                    console.log('Тайлсет загружен:', this.tilesets);
                };
                img.onerror = () => {
                    console.error("Ошибка при загрузке изображения:", imageSource);
                };
            }
        };
        tilesetRequest.send();
    },

    // Отображение карты
    draw: function (ctx) {
        if (!this.mapData || !this.tilesets.length || !this.tLayers.length) {
            console.log("Ожидание загрузки данных слоёв и карты.");
            setTimeout(function() {
                mapManager.draw(ctx);
            }, 100);
            return;
        }

        this.tLayers.forEach(layer => {
            if (layer.visible) {
                // Пройтись по всем тайлам в слое
                this.drawLayer(ctx, layer);
            }
        });
    },

    // Отображение одного слоя карты с масштабированием тайлов
    drawLayer: function (ctx, layer) {
        const layerWidth = layer.width;
        const layerHeight = layer.height;
        const layerData = layer.data;  // Массив данных (индексы тайлов)

        // Пройтись по всем видимым тайлам в пределах области видимости (аналог isVisible)
        const startX = Math.max(0, Math.floor(this.view.x / this.scaledTileWidth));
        const startY = Math.max(0, Math.floor(this.view.y / this.scaledTileHeight));
        const endX = Math.min(layerWidth, Math.ceil((this.view.x + this.view.w) / this.scaledTileWidth));
        const endY = Math.min(layerHeight, Math.ceil((this.view.y + this.view.h) / this.scaledTileHeight));


        // Отрисовываем видимые тайлы
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const tileIndex = layerData[y * layerWidth + x];

                if (tileIndex === 0) continue;  // Пропускаем пустые тайлы (если tileIndex === 0)

                const tileset = this.getTileset(tileIndex);
                const tile = this.getTile(tileIndex, tileset);

                // Вычисляем позицию на канвасе с учетом смещения
                const drawX = x * this.scaledTileWidth - this.view.x;
                const drawY = y * this.scaledTileHeight - this.view.y;

                ctx.drawImage(
                    tileset.img,
                    tile.px, tile.py, this.tSize.x, this.tSize.y,
                    drawX, drawY,
                    this.scaledTileWidth, this.scaledTileHeight
                );
            }
        }
    },

// Получение набора тайлов по индексу
    getTileset: function (tileIndex) {
        for (let i = this.tilesets.length - 1; i >= 0; i--) {
            if (tileIndex >= this.tilesets[i].firstgid) {
                return this.tilesets[i];
            }
        }
        return null;
    },

    // Получение координат тайла на изображении
    getTile: function (tileIndex, tileset) {
        const localIdx = tileIndex - tileset.firstgid;
        const px = (localIdx % tileset.xCount) * this.tSize.x;
        const py = Math.floor(localIdx / tileset.xCount) * this.tSize.y;
        return { px, py };
    },

    getTilesetIdx: function (x, y) {
        // Преобразование мировых координат в индекс тайла
        const wX = x;
        const wY = y;
        const idx = Math.floor(wY / this.tSize.y) * this.xCount + Math.floor(wX / this.tSize.x);

        /*// Проверка на выход за границы слоя
        if (idx < 0 || idx >= this.tLayers.data.length) {
            console.error("Координаты за пределами карты");
            return null;
        }*/

        let idxList = [];
        this.tLayers.forEach(layer => {
            idxList.push(layer.data[idx]);
        })

        // Возврат индекса тайла
        return idxList;
    }
};


// Базовый класс для всех объектов
class Entity {
    constructor(x = 0, y = 0, width = 0, height = 0, name = "") {
        this.pos_x = x;  // Координата X
        this.pos_y = y;  // Координата Y
        this.size_x = width;  // Ширина
        this.size_y = height; // Высота
        this.name = name;  // Имя объекта
        this.move_x = 0;
        this.move_y = 0;
        this.prev_move_name = null
        this.speed = 16;      // Скорость движения
    }

    // Метод для отображения объекта
    draw(ctx) {}

    // Обновление состояния объекта
    update() {}

    // Метод для обработки столкновения с другими объектами
    onTouchEntity(obj) {}

    // Метод для уничтожения объекта
    kill() {}

    // Метод для обработки столкновения с картой
    onTouchMap(mas_idx) {
        return !mas_idx[1];
    }

    // Метод удара
    punch(obj) {}
}

// Класс игрока
class Player extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, "player");
        this.lifetime = 3000; // Здоровье игрока
        this.move_x = 0;     // Направление движения по X
        this.move_y = 0;     // Направление движения по Y
        this.speed = 16;      // Скорость движения
        this.prev_move_name = "player_down"
        this.score = 0;
        document.getElementById('hp').innerText = this.lifetime;
    }

    // Метод для отображения игрока
    draw(ctx) {
        if (this.move_x > 0) {
            spriteManager.drawSprite(ctx, "player_right", this.pos_x, this.pos_y);
            this.prev_move_name = "player_right";
        }
        else if (this.move_x < 0) {
            spriteManager.drawSprite(ctx, "player_left", this.pos_x, this.pos_y);
            this.prev_move_name = "player_left";
        }
        else if (this.move_y > 0) {
            spriteManager.drawSprite(ctx, "player_down", this.pos_x, this.pos_y);
            this.prev_move_name = "player_down";
        }
        else if (this.move_y < 0) {
            spriteManager.drawSprite(ctx, "player_up", this.pos_x, this.pos_y);
            this.prev_move_name = "player_up";
        }
        else {
            spriteManager.drawSprite(ctx, this.prev_move_name, this.pos_x, this.pos_y);
        }
    }

    // Метод для обработки столкновения с другими объектами
    onTouchEntity(obj) {
        if (obj.name.match(/health/)) {  // Если объект типа Bonus
            this.lifetime += 50;  // Увеличиваем время жизни игрока
            this.score += 10;
            obj.kill();  // Уничтожаем бонус

        } else if (obj.name.match(/mob/)) {  // Если столкновение с врагом
            obj.lifetime -= 20;
            this.score += 50;
            soundManager.play("sounds/punch.mp3", {volume: 1});
            if (obj.lifetime <= 0) obj.kill();  // Уничтожаем врага

        } else if (obj.name.match(/end/)) {  // Если столкновение с врагом
            soundManager.play("sounds/victory.mp3", {volume: 1});
            gameManager.startLevelTwo();  // Уничтожаем врага
        }

        document.getElementById('score').innerText = this.score;
        document.getElementById('hp').innerText = this.lifetime;
    }

    // Метод удара
    punch(obj) {
        console.log(`${this.name} наносит удар по ${obj.name}`);
        obj.kill();  // Уничтожаем объект, по которому был нанесен удар
    }
    // Обновление состояния объекта
    update() {
        physicManager.update(this);  // Используем менеджер физики для обновления
    }
}

// Класс моба (танк)
class Mob extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, "mob");
        this.currentPromise = null;
        this.lifetime = 50;  // Здоровье
        this.move_x = 0;     // Направление движения по X
        this.move_y = 0;    // Направление движения по Y
        this.speed = 16;      // Скорость движения
        this.prev_move_name = "mob_down"
        this.tickPause = 0;
        this.tickActive = 5;
        //this.startInterval()
    }
    // Обновление состояния объекта
    update() {
        this.tickPause++;
        if (this.tickPause === this.tickActive) {
            this.tickPause = 0;
            this.activateMob();
            physicManager.update(this);  // Используем менеджер физики для обновления
        }
    }


    activateMob(){
        //console.log("=-=", gameManager.entities.find(entity => entity.name === 'player'));
        if (Math.abs(gameManager.entities.find(entity => entity.name === 'player').pos_x - this.pos_x) <= 16 &&
            Math.abs(gameManager.entities.find(entity => entity.name === 'player').pos_y - this.pos_y) <= 16) {
            this.onTouchEntity(gameManager.entities.find(entity => entity.name === 'player'));
            this.move_x = 0;
            this.move_y = 0;
            return;
        }
        this.move_x = this.getRandomMobMove(-this.speed, 0, this.speed);
        this.move_y = this.getRandomMobMove(-this.speed, 0, this.speed);
    }


    getRandomMobMove(a, b, c) {
        const randomIndex = Math.floor(Math.random() * 3);
        switch(randomIndex) {
            case 0: return a;
            case 1: return b;
            case 2: return c;
        }
    }

    // Метод для отображения танка
    draw(ctx) {
        if (this.move_x > 0) {
            spriteManager.drawSprite(ctx, "mob_right", this.pos_x, this.pos_y);
            this.prev_move_name = "mob_right";
        }
        else if (this.move_x < 0) {
            spriteManager.drawSprite(ctx, "mob_left", this.pos_x, this.pos_y);
            this.prev_move_name = "mob_left";
        }
        else if (this.move_y > 0) {
            spriteManager.drawSprite(ctx, "mob_down", this.pos_x, this.pos_y);
            this.prev_move_name = "mob_down";
        }
        else if (this.move_y < 0) {
            spriteManager.drawSprite(ctx, "mob_up", this.pos_x, this.pos_y);
            this.prev_move_name = "mob_up";
        }
        else {
            spriteManager.drawSprite(ctx, this.prev_move_name, this.pos_x, this.pos_y);
        }
    }

    // Метод для обработки столкновения с другими объектами
    onTouchEntity(obj) {
        if (obj.name.match(/player/)) {  // Если столкновение с игроком
            obj.lifetime -= 40;
            soundManager.play("sounds/gotPunch.mp3", {volume: 1});
            document.getElementById('hp').innerText = obj.lifetime;
            if (obj.lifetime <= 0) {
                soundManager.play("sounds/loseCombat.mp3", {volume: 1});
                gameManager.restartLevel(true);
            }
        }
    }

    kill() {
        soundManager.play("sounds/punch.mp3", {volume: 1});
        gameManager.kill(this);
        soundManager.stopSound("sounds/punch.mp3");
    }

    // Метод удара
    punch(obj) {
        console.log(`${this.name} наносит удар по ${obj.name}`);
        obj.kill();  // Уничтожаем объект, по которому был нанесен удар
    }
    /*
    startInterval() {
        // Метод, который нужно запускать каждую секунду
        this.activateMob();

        // Устанавливаем интервал
        this.intervalId = setInterval(() => {
            this.activateMob();
        }, 600);
    }

    stopInterval() {
        // Остановка интервала
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    */
}

// Класс бонуса
class Bonus extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, "health");  // Уникальное имя бонуса
    }

    // Метод для отображения бонуса
    draw(ctx) {
        spriteManager.drawSprite(ctx, "health", this.pos_x, this.pos_y);
    }

    // Метод уничтожения бонуса
    kill() {
        soundManager.play("sounds/regener.mp3", {volume: 1});
        gameManager.kill(this);
    }
}

// Класс старта
class Start extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, "start");  // Уникальное имя бонуса
    }

    // Метод для отображения бонуса
    draw(ctx) {
        spriteManager.drawSprite(ctx, "sprite13", this.pos_x, this.pos_y);
    }
}

// Класс финиша
class End extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, "end");  // Уникальное имя бонуса
    }

    // Метод для отображения бонуса
    draw(ctx) {
        spriteManager.drawSprite(ctx, "sprite13", this.pos_x, this.pos_y);
    }
}

