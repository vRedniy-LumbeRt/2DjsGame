const soundManager = {
    clips: {},         // Объект для хранения загруженных звуков
    context: null,     // Аудиоконтекст
    gainNode: null,    // Узел для управления громкостью
    loaded: false,     // Флаг загрузки всех звуков
    activeSources: {}, // Хранилище активных источников звука (по пути)

    // Инициализация аудиоконтекста
    init: function () {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.context.createGain();
            this.gainNode.connect(this.context.destination);
        } catch (e) {
            console.error("Web Audio API не поддерживается в этом браузере.");
        }
    },

    // Загрузка одного аудиофайла
    load: function (path, callback) {
        if (this.clips[path]) {
            callback?.(this.clips[path]);
            return;
        }

        const request = new XMLHttpRequest();
        request.open("GET", path, true);
        request.responseType = "arraybuffer";

        request.onload = () => {
            this.context.decodeAudioData(request.response, (buffer) => {
                const clip = {
                    buffer: buffer,
                    play: (settings = {}) => this.play(path, settings)
                };
                this.clips[path] = clip;
                callback?.(clip);
            }, (error) => {
                console.error(`Ошибка декодирования аудио: ${path}`, error);
            });
        };

        request.send();
    },

    // Загрузка массива аудиофайлов
    loadArray: function (array, callback) {
        let loadedCount = 0;

        array.forEach(path => {
            this.load(path, () => {
                loadedCount++;
                if (loadedCount === array.length) {
                    this.loaded = true;
                    callback?.();
                }
            });
        });
    },

    // Воспроизведение аудиофайла
    play: function (path, { loop = false, volume = 1 } = {}) {
        const clip = this.clips[path];
        console.log(path);
        if (!clip) {
            setTimeout(() => {
                this.play(path, { loop, volume });
            }, 100);
            return;
        }

        const source = this.context.createBufferSource();
        source.buffer = clip.buffer;
        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(this.gainNode);

        source.loop = loop;
        source.start(0);

        // Сохраняем источник по пути
        this.activeSources[path] = source;
        console.log(path, this.activeSources);

        // Удаляем источник после окончания (если нет цикла)
        source.onended = () => {
            if (this.activeSources[path] === source) {
                delete this.activeSources[path];
            }
        };
    },

    // Остановка конкретного звука
    stopSound: function (path) {
        const source = this.activeSources[path];
        if (source) {
            try {
                source.stop(); // Останавливаем источник
            } catch (e) {
                console.error("Ошибка остановки звука:", e);
            }
            delete this.activeSources[path]; // Удаляем из активных источников
        } else {
            console.log(`Звук с путем "${path}" не найден среди активных.`);
        }
    },

    inActiveSources: function (path) {
        const source = this.activeSources[path];
        if (source) {
            return true;
        }
        return false;
    },

    // Управление громкостью
    setVolume: function (value) {
        this.gainNode.gain.value = value;
    }
};
