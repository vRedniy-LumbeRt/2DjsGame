// Менеджер физики объектов
let physicManager = {
    // Основная функция обновления состояния объекта
    update: function (obj) {
        // Если скорости движения равны нулю, объект остаётся на месте
        if (obj.move_x === 0 && obj.move_y === 0) return "stop";

        // Вычисление новых координат объекта
        const newX = (obj.pos_x + obj.move_x);
        const newY = (obj.pos_y + obj.move_y);

        // Определение индекса тайла на карте по новым координатам
        let ts = mapManager.getTilesetIdx(newX, newY);
        //console.log(ts);
        //console.log(newX, newY, "--");

        // Проверка наличия объекта на пути по новым координатам
        let e = this.entityAtXY(obj, newX, newY);

        // Если обнаружено столкновение с другим объектом
        if (e !== null) {
            console.log("obj on the way", e);
            obj.onTouchEntity(e)

            if (e.name.match(/mob/)){
                return "break";
            }
        }

        // Если на пути нет свободного пространства
        if (!obj.onTouchMap(ts)) {
            return "break";
        }

        // Если путь свободен и нет столкновений
        obj.pos_x = newX;
        obj.pos_y = newY;

        return "move"; // Объект успешно перемещён
    },

    // Вспомогательная функция для определения столкновения с объектами
    entityAtXY: function (obj, x, y) {
        // Перебираем все объекты в массиве gameManager.entities
        for (let i = 0; i < gameManager.entities.length; i++) {
            let e = gameManager.entities[i];

            // Пропускаем текущий объект, если имена совпадают
            if (e.name !== obj.name) {
                // Проверка на пересечение объектов
                if (
                    x < e.pos_x ||
                    y < e.pos_y ||
                    x > e.pos_x ||
                    y > e.pos_y
                ) {
                    continue;
                }

                // Возвращаем объект, если найдено пересечение
                return e;
            }
        }
        // Столкновение не обнаружено
        return null;
    }
};
