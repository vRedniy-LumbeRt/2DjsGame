let eventsManager = {
    bind: [], // Массив ключей действий
    action: [], // Запись активных действий
    mouse: { x: 0, y: 0 }, // Поле для хранения координат мыши
    setup: function (canvas) {
        // Key bindings
        this.bind[87] = 'up';    // W - move up
        this.bind[65] = 'left';  // A - move left
        this.bind[83] = 'down';  // S - move down
        this.bind[68] = 'right'; // D - move right
        this.bind[32] = 'punch';  // Space - fire

        // Mouse events
        canvas.addEventListener("mousedown", this.onMouseDown);
        canvas.addEventListener("mouseup", this.onMouseUp);
        canvas.addEventListener("mousemove", this.onMouseMove); // Добавляем слушатель движения мыши

        // Keyboard events
        document.body.addEventListener("keydown", this.onKeyDown);
        document.body.addEventListener("keyup", this.onKeyUp);
    },
    onMouseDown: function (event) {
        eventsManager.action["punch"] = true;
        eventsManager.updateMouseCoordinates(event); // Обновляем координаты мыши
        const resultDiv = document.getElementById("result");
        //resultDiv.innerHTML = `Мышь нажата: (${eventsManager.mouse.x}, ${eventsManager.mouse.y})`;
        //gameManager.update();
    },
    onMouseUp: function (event) {
        eventsManager.action["punch"] = false;
        eventsManager.updateMouseCoordinates(event); // Обновляем координаты мыши
        const resultDiv = document.getElementById("result");
        //resultDiv.innerHTML = `Мышь отпущена: (${eventsManager.mouse.x}, ${eventsManager.mouse.y})`;
        //gameManager.update();
    },
    onMouseMove: function (event) {
        eventsManager.updateMouseCoordinates(event); // Обновляем координаты мыши
        const resultDiv = document.getElementById("result");
        //resultDiv.innerHTML = `Координаты мыши: (${eventsManager.mouse.x}, ${eventsManager.mouse.y})`;
        //gameManager.update();
    },
    onKeyDown: function (event) {
        const action = eventsManager.bind[event.keyCode];
        if (action) {
            eventsManager.action[action] = true;
            if (!soundManager.inActiveSources("sounds/walking.mp3")) soundManager.play("sounds/walking.mp3", { loop: true, volume: 0.3 });
            //document.getElementById("result").innerHTML = `Нажата: ${event.key}`;
            //gameManager.update();
        }
    },
    onKeyUp: function (event) {
        const action = eventsManager.bind[event.keyCode];
        if (action) {
            eventsManager.action[action] = false;
            console.log("---", soundManager.activeSources);
            // Проверяем, зажаты ли другие клавиши WASD
            const keysPressed = ["up", "left", "down", "right"].some(key => eventsManager.action[key]);

            if (!keysPressed) {
                soundManager.stopSound("sounds/walking.mp3");
            }
        }
    },
    updateMouseCoordinates: function (event) {
        // Сохраняем текущие координаты мыши
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }
};
