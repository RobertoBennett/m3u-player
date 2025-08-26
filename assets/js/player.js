class M3UPlayer {
    constructor(playerId, url) {
        this.video = document.getElementById(playerId);
        this.playlistContainer = document.getElementById(`${playerId}-playlist`);
        this.url = url;
        this.playlist = [];
        this.currentIndex = 0;
        this.hls = null;

        if (!this.video) return;

        // Add ended event listener for auto-next
        this.video.addEventListener('ended', () => this.playNext());

        this.init();
    }

    async init() {
        try {
            if (this.url.includes('.m3u8')) {
                await this.initHLS();
            } else if (this.url.includes('.m3u')) {
                await this.initM3U();
            }
        } catch (error) {
            console.error('Error initializing player:', error);
        }
    }

    async initHLS() {
        try {
            const response = await fetch(this.url);
            const content = await response.text();
            this.playlist = this.parseM3U(content);

            if (this.playlist.length > 0) {
                if (Hls.isSupported()) {
                    this.hls = new Hls();
                    this.loadHLSStream(this.playlist[0].url);
                } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
                    this.video.src = this.playlist[0].url;
                }
                this.renderPlaylist();
            }
        } catch (error) {
            console.error('Error loading HLS playlist:', error);
        }
    }

    loadHLSStream(url) {
        if (this.hls) {
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // Autoplay prevented
            });
        }
    }

    async initM3U() {
        try {
            const response = await fetch(this.url);
            const content = await response.text();
            this.playlist = this.parseM3U(content);
            this.renderPlaylist();
            if (this.playlist.length > 0) {
                this.playItem(0);
            }
        } catch (error) {
            console.error('Error loading M3U playlist:', error);
        }
    }

    parseM3U(content) {
        const lines = content.split('\n');
        const playlist = [];
        let currentItem = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('#EXTINF:')) {
                // Улучшенное извлечение tvg-name - поддерживает разные форматы
                let tvgName = null;
                
                // Пробуем найти tvg-name="значение"
                let tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
                if (tvgNameMatch) {
                    tvgName = tvgNameMatch[1];
                } else {
                    // Пробуем найти tvg-name=значение (без кавычек до следующего пробела или атрибута)
                    tvgNameMatch = line.match(/tvg-name=([^\s]+)/);
                    if (tvgNameMatch) {
                        tvgName = tvgNameMatch[1];
                        // Убираем кавычки если они есть в начале
                        if (tvgName.startsWith('"')) {
                            tvgName = tvgName.substring(1);
                        }
                    }
                }

                // Извлекаем duration и title
                const matches = line.match(/#EXTINF:(-?\d+\.?\d*),(.*)$/);

                if (matches) {
                    let title = matches[2].trim();
                    
                    // Если в title есть атрибуты (group-title и т.д.), извлекаем только название после последней запятой
                    if (title.includes('group-title=') || title.includes('tvg-')) {
                        const lastCommaIndex = title.lastIndexOf(',');
                        if (lastCommaIndex !== -1) {
                            title = title.substring(lastCommaIndex + 1).trim();
                        }
                    }

                    currentItem = {
                        duration: parseFloat(matches[1]),
                        tvgName: tvgName,
                        title: title || 'Untitled',
                        url: ''
                    };
                }
            } else if (line && !line.startsWith('#')) {
                // Обработка URL
                const url = line.trim();
                if (currentItem) {
                    currentItem.url = url;
                    playlist.push(currentItem);
                    currentItem = null;
                } else {
                    // Если нет EXTINF тега, используем имя файла
                    playlist.push({
                        duration: -1,
                        tvgName: null,
                        title: this.getFileName(url),
                        url: url
                    });
                }
            }
        }

        return playlist;
    }

    getFileName(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            return filename || 'Untitled';
        } catch (e) {
            const parts = url.split('/');
            return parts[parts.length - 1] || 'Untitled';
        }
    }

    // Функция для получения отображаемого названия
    getDisplayName(item) {
        // Приоритет: tvg-name > title > filename
        if (item.tvgName && item.tvgName.trim() !== '') {
            return item.tvgName;
        }
        return item.title || 'Untitled';
    }

    renderPlaylist() {
        if (!this.playlistContainer || !this.playlist.length) return;

        // Генерируем HTML списка воспроизведения
        const playlistHTML = this.playlist.map((item, index) => `
            <div class="m3u-playlist-item ${index === this.currentIndex ? 'active' : ''}"
                 data-index="${index}">
                ${index + 1}. ${this.getDisplayName(item)}
            </div>
        `).join('');

        // Обновляем содержимое контейнера, избегая замены DOM-узлов
        this.playlistContainer.innerHTML = playlistHTML;

        // Добавляем обработчик клика только один раз
        this.playlistContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.m3u-playlist-item');
            if (item) {
                const index = parseInt(item.dataset.index);
                this.playItem(index);
            }
        });
    }

    playItem(index) {
        if (index < 0 || index >= this.playlist.length) return;

        this.currentIndex = index;
        const item = this.playlist[index];

        if (this.url.includes('.m3u8')) {
            if (this.hls) {
                this.loadHLSStream(item.url);
            } else {
                this.video.src = item.url;
            }
        } else {
            this.video.src = item.url;
        }

        const items = this.playlistContainer.getElementsByClassName('m3u-playlist-item');
        Array.from(items).forEach((element, i) => {
            // Обновляем класс без скроллинга
            element.classList.toggle('active', i === index);
        });
    }

    playNext() {
        const nextIndex = (this.currentIndex + 1) % this.playlist.length;
        this.playItem(nextIndex);
    }
}

function initM3UPlayer(playerId, url) {
    new M3UPlayer(playerId, url);
}