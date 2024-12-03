let spriteManager = {
    image: new Image(), // объект изображения
    sprites: [], // массив объектов спрайтов
    imgLoaded: false, // изображение загружено
    jsonLoaded: false, // JSON загружен

    // Загрузка атласа
    loadAtlas: function(atlasJson, atlasImg) {
        let request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState === 4 && request.status === 200) {
                spriteManager.parseAtlas(request.responseText); // Разобрать атлас
            }
        };
        request.open("GET", atlasJson, true);
        request.send();
        this.loadImg(atlasImg); // Загрузка изображения
    },

    // Загрузка изображения
    loadImg: function(imgName) {
        this.image.onload = function() {
            spriteManager.imgLoaded = true; // Флаг загрузки изображения
        };
        this.image.src = imgName; // Установить путь к изображению
    },

    // Разбор JSON-атласа
    parseAtlas: function(atlasJSON) {
        let atlas = JSON.parse(atlasJSON); // Парсинг JSON
        for (let name in atlas.frames) { // Перебор всех спрайтов
            let frame = atlas.frames[name].frame;
            this.sprites.push({
                name: name,
                x: frame.x,
                y: frame.y,
                w: frame.w,
                h: frame.h
            });
        }
        this.jsonLoaded = true; // Флаг загрузки JSON
    },

    // Получение спрайта по имени
    getSprite: function(name) {
        for (let i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i].name === name) {
                return this.sprites[i];
            }
        }
        return null; // Спрайт не найден
    },

    // Отображение спрайта
    drawSprite: function(ctx, name, x, y) {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(function() {
                spriteManager.drawSprite(ctx, name, x, y);
            }, 100);
            return;
        }
        let sprite = this.getSprite(name);
        if (!sprite) {
            console.error("Sprite not found: " + name);
            return;
        }

        const drawX = x * mapManager.scale - mapManager.view.x;
        const drawY = y * mapManager.scale - mapManager.view.y;

        if (!mapManager.isVisibleSprite(drawX, drawY)) {
            return;
        }

        // Отображение спрайта
        ctx.drawImage(
            this.image, sprite.x, sprite.y, sprite.w, sprite.h,
            drawX, drawY, sprite.w * mapManager.scale, sprite.h * mapManager.scale
        );
    }
};
