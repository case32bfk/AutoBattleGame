const TrainingPage = {
    currentMonsterImageName: null,
    isFirstLoad: true,
    intervalId: null,
    
    getHTML() {
        return `
            <div id="training-screen">
                <div class="screen-header">
                    <h2>培養</h2>
                    <div class="gold-display">💰 <span id="gold-count" class="gold-current">0</span></div>
                </div>
                <div class="training-content">
                    <div class="monster-info">
                        <div class="name-edit-container">
                            <span id="monster-name">小火龍</span>
                            <button id="btn-edit-name" class="edit-btn">✏️</button>
                        </div>
                        <div class="monster-image" id="monster-image">
                            <div class="room-background"></div>
                            <div class="monster-sprite"></div>
                            <div class="element-ribbon element-ribbon-top-left" id="element-ribbon-1"></div>
                            <div class="element-ribbon element-ribbon-bottom-right" id="element-ribbon-2"></div>
                        </div>
                        <div class="status-row">
                            <div class="affection-container">
                                <span class="affection-label">♥<span id="monster-affection-lv">1</span></span>
                                <span class="level-label"> Lv.<span id="monster-level">1</span></span>
                            </div>
                            <div class="exp-container">
                                <span class="exp-label">經驗</span>
                                <div class="exp-gauge-container">
                                    <div class="exp-bar" id="exp-bar" style="width: 0%;"></div>
                                    <span class="exp-text"><span id="monster-exp">0</span>/<span id="monster-exp-max">100</span></span>
                                </div>
                            </div>
                            <div class="hp-container">
                                <span class="hp-label">生命</span>
                                <div class="hp-gauge-container">
                                    <div class="hp-bar" id="hp-bar" style="width: 100%;"></div>
                                    <span class="hp-text"><span id="monster-hp">100</span>/<span id="monster-max-hp">100</span></span>
                                </div>
                            </div>
                            <div class="status-sub-row">
                                <div class="stm-container">
                                    <span class="stm-label">飽足</span>
                                    <div class="stm-gauge-container">
                                        <div class="stm-bar" id="stm-bar" style="width: 100%;"></div>
                                        <span class="stm-text"><span id="monster-stm">100</span>/100</span>
                                    </div>
                                </div>
                                <div class="clean-container">
                                    <span class="clean-label">清潔</span>
                                    <div class="clean-gauge-container">
                                        <div class="clean-bar" id="clean-bar" style="width: 100%;"></div>
                                        <span class="clean-text"><span id="monster-clean">100</span>/100</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button id="btn-feed"><span class="btn-icon">🍖</span><span class="btn-text">餵食</span></button>
                            <button id="btn-bath"><span class="btn-icon">🧼</span><span class="btn-text">洗澡</span></button>
                            <button id="btn-clean"><span class="btn-icon">🧹</span><span class="btn-text">清理</span></button>
                            <button id="btn-interact"><span class="btn-icon">💬</span><span class="btn-text">互動</span></button>
                        </div>
                        <div class="stats-row">
                            <div class="stat-box">
                                <span class="stat-label">力</span>
                                <span class="stat-value" id="monster-str">15</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">智</span>
                                <span class="stat-value" id="monster-int">8</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">體</span>
                                <span class="stat-value" id="monster-def">10</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">速</span>
                                <span class="stat-value" id="monster-dex">12</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">美</span>
                                <span class="stat-value" id="monster-cha">8</span>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button id="btn-skills"><span class="btn-icon">⚡</span><span class="btn-text">技能</span></button>
                            <button id="btn-evolve"><span class="btn-icon">🔄</span><span class="btn-text">進化</span></button>
                            <button id="btn-room"><span class="btn-icon">🏠</span><span class="btn-text">房間</span></button>
                            <button disabled><span class="btn-icon">🔒</span><span class="btn-text">未開放</span></button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer-nav">
                <button class="nav-btn active" id="nav-training">
                    <span class="nav-icon">🏠</span>
                    <span class="nav-label">培養</span>
                </button>
                <button class="nav-btn" id="nav-hunt">
                    <span class="nav-icon">⚔️</span>
                    <span class="nav-label">狩獵</span>
                </button>
                <button class="nav-btn" id="nav-gacha">
                    <span class="nav-icon">🎁</span>
                    <span class="nav-label">轉蛋</span>
                </button>
                <button class="nav-btn" id="nav-system">
                    <span class="nav-icon">⚙️</span>
                    <span class="nav-label">系統</span>
                </button>
            </div>
        `;
    },

    async mount(container) {
        container.innerHTML = this.getHTML();
        await this.bindEvents();
        this.updateMonsterDisplay(true);
        
        this.intervalId = setInterval(() => {
            const data = getSaveData();
            if (data && data.monster) {
                decreaseStmAndClean(data.monster);
                saveGame(data);
                this.updateMonsterDisplay();
            }
        }, 10000);
    },

    unmount() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    async bindEvents() {
        document.getElementById('btn-edit-name').addEventListener('click', () => this.editMonsterName());
        document.getElementById('btn-feed').addEventListener('click', () => this.feedMonster());
        document.getElementById('btn-bath').addEventListener('click', () => this.bathMonster());
        document.getElementById('btn-clean').addEventListener('click', () => this.toiletMonster());
        document.getElementById('btn-interact').addEventListener('click', () => this.interactMonster());
        document.getElementById('btn-skills').addEventListener('click', () => this.showSubWindow('skills'));
        document.getElementById('btn-evolve').addEventListener('click', () => this.showEvolveModal());
        document.getElementById('btn-room').addEventListener('click', () => this.showSubWindow('room'));
        
        document.getElementById('nav-hunt').addEventListener('click', () => Router.navigate('battle'));
        document.getElementById('nav-system').addEventListener('click', () => Router.navigate('system'));
        document.getElementById('nav-gacha').addEventListener('click', () => alert('轉蛋功能尚未開放'));
    },

    showSubWindow(type) {
        const existing = document.getElementById('sub-window');
        const existingOverlay = document.getElementById('sub-window-overlay');
        if (existing) {
            if (existing.dataset.type === type) {
                existing.remove();
                existingOverlay?.remove();
                return;
            }
            existing.remove();
        }
        existingOverlay?.remove();

        const data = getSaveData();
        if (!data || !data.monster) { alert('沒有寵物資料'); return; }

        let content = '';
        let title = '';
        let pageInfo = '';
        let itemsPerPage = 6;
        let currentPage = 1;
        let totalPages = 1;
        let allItems = [];

        if (type === 'skills') {
            title = '技能';
            const skillIds = data.monster.skill_id || [];
            skillIds.forEach(skillId => {
                const skill = SkillDataManager.getSkillById(skillId);
                if (skill) allItems.push(skill);
            });

            if (allItems.length > 0) {
                totalPages = Math.ceil(allItems.length / itemsPerPage);
            } else {
                content += '<p class="empty-msg">尚未習得技能</p>';
            }
        } else if (type === 'room') {
            title = '房間';
            const rooms = RoomDataManager.getAllRooms();
            const currentRoom = data.monster.room || 'forest';
            
            rooms.forEach(room => {
                const isOpen = (data.openRooms || []).includes(room.roomId) || room.roomId === 'forest';
                allItems.push({ ...room, isOpen, isCurrent: room.roomId === currentRoom });
            });
            
            if (allItems.length > 0) {
                totalPages = allItems.length;
                itemsPerPage = 1;
            } else {
                content += '<p class="empty-msg">暫無房間</p>';
            }
        }

        const html = `<div id="sub-window" data-type="${type}">
            <div class="sub-window-content ${type === 'skills' ? 'skills' : ''}" data-page="1" data-total="${totalPages}">${content}</div>
            <div class="sub-window-page-info"></div>
            <div class="sub-window-footer">
                <button class="sub-window-btn prev">◂</button>
                <button class="sub-window-close">關閉</button>
                <button class="sub-window-btn next">▸</button>
            </div>
        </div>`;

        const overlayHtml = `<div id="sub-window-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:99;"></div>`;
        document.getElementById('game-container').insertAdjacentHTML('beforeend', overlayHtml);
        document.getElementById('game-container').insertAdjacentHTML('beforeend', html);

        const subWindow = document.getElementById('sub-window');
        const subWindowOverlay = document.getElementById('sub-window-overlay');
        const pages = ['skills', 'room'];
        let currentIndex = pages.indexOf(type);
        let skillPage = 1;

        function closeSubWindow() {
            subWindow.remove();
            subWindowOverlay.remove();
        }

        function getSkillIconHtml(icon) {
            if (!icon) return '⚡';
            if (icon.length <= 2) {
                return icon;
            }
            return `<img src="${BASE_PATH}datas/images/ui/${icon}.png" style="width:16px;height:16px;vertical-align:middle;">`;
        }

        function renderSkillsPage(page) {
            const contentEl = subWindow.querySelector('.sub-window-content');
            const pageInfoEl = subWindow.querySelector('.sub-window-page-info');
            const start = (page - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = allItems.slice(start, end);
            
            contentEl.innerHTML = pageItems.map(skill => `
                <div class="sub-window-item">
                    <div class="skill-header">
                        <span class="skill-icon">${getSkillIconHtml(skill.systemIcon)}</span>
                        <span class="skill-name">${skill.name}</span>
                    </div>
                    <div class="skill-desc">${skill.description || '無描述'}</div>
                </div>
            `).join('');
            
            pageInfoEl.textContent = `${page}/${totalPages}`;
            contentEl.dataset.page = page;
        }

        let roomPage = 1;

        function renderRoomsPage(page) {
            const contentEl = subWindow.querySelector('.sub-window-content');
            const pageInfoEl = subWindow.querySelector('.sub-window-page-info');
            const room = allItems[page - 1];
            
            if (!room) return;
            
            const imageName = room.image || `room_${room.roomId}`;
            const btnText = room.isCurrent ? '設定中' : (room.isOpen ? '設定' : '🔒');
            const btnClass = room.isCurrent ? 'btn-setting current' : (room.isOpen ? 'btn-setting' : 'btn-locked');
            const btnDisabled = !room.isOpen || room.isCurrent;
            
            contentEl.innerHTML = `
                <div class="room-display">
                    <img src="${BASE_PATH}datas/images/rooms/${imageName}.png" class="room-image">
                    <div class="room-info">
                        <div class="room-name">${room.name}</div>
                        <button class="${btnClass}" data-room-id="${room.roomId}" ${btnDisabled ? 'disabled' : ''}>${btnText}</button>
                    </div>
                </div>
            `;
            
            pageInfoEl.textContent = `${page}/${totalPages}`;
            contentEl.dataset.page = page;
            
            if (!btnDisabled) {
                contentEl.querySelector('.btn-setting').addEventListener('click', (e) => {
                    const roomId = e.target.dataset.roomId;
                    this.selectRoom(roomId);
                    closeSubWindow();
                });
            }
        }

        if (type === 'skills' && allItems.length > 0) {
            renderSkillsPage(1);
        } else if (type === 'room' && allItems.length > 0) {
            renderRoomsPage(1);
        }

        subWindow.querySelector('.sub-window-close').addEventListener('click', () => closeSubWindow());

        subWindow.querySelector('.prev').addEventListener('click', () => {
            if (type === 'skills' && totalPages > 1) {
                skillPage = skillPage > 1 ? skillPage - 1 : totalPages;
                renderSkillsPage(skillPage);
            } else if (type === 'room' && totalPages > 1) {
                roomPage = roomPage > 1 ? roomPage - 1 : totalPages;
                renderRoomsPage(roomPage);
            } else {
                currentIndex = (currentIndex - 1 + pages.length) % pages.length;
                this.showSubWindow(pages[currentIndex]);
            }
        });

        subWindow.querySelector('.next').addEventListener('click', () => {
            if (type === 'skills' && totalPages > 1) {
                skillPage = skillPage < totalPages ? skillPage + 1 : 1;
                renderSkillsPage(skillPage);
            } else if (type === 'room' && totalPages > 1) {
                roomPage = roomPage < totalPages ? roomPage + 1 : 1;
                renderRoomsPage(roomPage);
            } else {
                currentIndex = (currentIndex + 1) % pages.length;
                this.showSubWindow(pages[currentIndex]);
            }
        });

        document.addEventListener('keydown', function handleSubWindowKey(e) {
            const sw = document.getElementById('sub-window');
            if (!sw) {
                document.removeEventListener('keydown', handleSubWindowKey);
                return;
            }
            if (e.key === '◂' || e.key === 'ArrowLeft') {
                sw.querySelector('.prev').click();
            } else if (e.key === '▸' || e.key === 'ArrowRight') {
                sw.querySelector('.next').click();
            } else if (e.key === 'Escape') {
                closeSubWindow();
            }
        });

        if (type === 'room') {
            subWindow.querySelectorAll('.btn-select').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const roomId = e.target.closest('.sub-window-item').dataset.roomId;
                    this.selectRoom(roomId);
                    closeSubWindow();
                });
            });
        }
    },

    updateMonsterDisplay(isInitial = false) {
        const data = getSaveData();
        
        document.getElementById('gold-count').textContent = data ? (data.gold || 0) : 0;
        
        if (!data || !data.monster) {
            document.getElementById('monster-name').textContent = '---';
            document.getElementById('monster-level').textContent = '---';
            document.getElementById('monster-exp').textContent = '---';
            document.getElementById('monster-exp-max').textContent = '---';
            document.getElementById('monster-hp').textContent = '---';
            document.getElementById('monster-max-hp').textContent = '---';
            document.getElementById('monster-str').textContent = '---';
            document.getElementById('monster-def').textContent = '---';
            document.getElementById('monster-dex').textContent = '---';
            document.getElementById('monster-int').textContent = '---';
            document.getElementById('monster-cha').textContent = '---';
            document.getElementById('monster-affection-lv').textContent = '---';
            document.getElementById('monster-stm').textContent = '---';
            document.getElementById('monster-clean').textContent = '---';
            document.getElementById('hp-bar').style.width = '0%';
            document.getElementById('exp-bar').style.width = '0%';
            document.getElementById('stm-bar').style.width = '0%';
            document.getElementById('clean-bar').style.width = '0%';
            document.querySelector('.monster-image .room-background').style.backgroundImage = '';
            const noDataSprite = document.querySelector('.monster-image .monster-sprite');
            noDataSprite.innerHTML = '';
            noDataSprite.textContent = '❓';
            this.currentMonsterImageName = null;
            document.getElementById('element-ribbon-1').innerHTML = '';
            document.getElementById('element-ribbon-2').innerHTML = '';
            return;
        }
        
        const m = data.monster;
        document.getElementById('monster-name').textContent = m.name || '未知';
        document.getElementById('monster-level').textContent = m.lv || 1;
        document.getElementById('monster-exp').textContent = m.exp || 0;
        document.getElementById('monster-exp-max').textContent = m.expToNextLevel || 100;
        document.getElementById('monster-hp').textContent = m.hp || 0;
        document.getElementById('monster-max-hp').textContent = m.maxhp || 100;
        document.getElementById('monster-str').textContent = m.str || 0;
        document.getElementById('monster-def').textContent = m.def || 0;
        document.getElementById('monster-dex').textContent = m.dex || 0;
        document.getElementById('monster-int').textContent = m.int || 0;
        document.getElementById('monster-cha').textContent = m.cha || 0;
        document.getElementById('monster-affection-lv').textContent = m.affection_lv || 1;
        document.getElementById('monster-stm').textContent = m.stm || 100;
        document.getElementById('monster-clean').textContent = m.clean || 100;
        
        document.getElementById('stm-bar').style.width = (m.stm || 100) + '%';
        document.getElementById('clean-bar').style.width = (m.clean || 100) + '%';
        
        const roomId = m.room || 'forest';
        const roomData = RoomDataManager.getRoomById(roomId);
        if (roomData && roomData.image) {
            document.querySelector('.monster-image .room-background').style.backgroundImage = `url('datas/images/rooms/${roomData.image}.png')`;
        }
        
        const monsterSprite = document.querySelector('.monster-image .monster-sprite');
        const monsterData = MonsterDataManager.getMonsterById(m.id);
        if (monsterData && monsterData.image_name) {
            this.currentMonsterImageName = monsterData.image_name;
            const cached = SpriteAnimator.getCachedImages(monsterData.image_name);
            if (cached) {
                monsterSprite.innerHTML = `<img src="${cached.frame1.src}" alt="${m.name}">`;
            } else {
                monsterSprite.innerHTML = `<img src="datas/images/monster/${monsterData.image_name}/${monsterData.image_name}_1.png" alt="${m.name}">`;
            }
        } else if (m.image_emoji) {
            this.currentMonsterImageName = null;
            monsterSprite.innerHTML = '';
            monsterSprite.textContent = m.image_emoji;
        } else if (m.image_name) {
            this.currentMonsterImageName = m.image_name;
            monsterSprite.innerHTML = `<img src="datas/images/monster/${m.image_name}/${m.image_name}_1.png" alt="${m.name}">`;
        } else {
            this.currentMonsterImageName = null;
            monsterSprite.innerHTML = '';
            monsterSprite.textContent = '🐉';
        }
        
        const hpPercent = ((m.hp || 0) / (m.maxhp || 1)) * 100;
        document.getElementById('hp-bar').style.width = hpPercent + '%';
        
        const expPercent = ((m.exp || 0) / (m.expToNextLevel || 1)) * 100;
        document.getElementById('exp-bar').style.width = expPercent + '%';
        
        if (ElementDataManager && ElementDataManager.elements) {
            this.updateElementRibbons(m.element);
        }
        
        displayUnchi(m, isInitial || this.isFirstLoad);
        if (isInitial || this.isFirstLoad) {
            this.isFirstLoad = false;
        }
    },

    updateElementRibbons(elementArray) {
        const ribbon1 = document.getElementById('element-ribbon-1');
        const ribbon2 = document.getElementById('element-ribbon-2');
        
        ribbon1.innerHTML = '';
        ribbon2.innerHTML = '';
        
        if (!elementArray || !Array.isArray(elementArray)) return;
        
        if (elementArray[0] !== null && elementArray[0] !== undefined) {
            const element1Data = ElementDataManager.getElementById(elementArray[0]);
            if (element1Data) {
                const iconData = ElementDataManager.resolveElementIcon(element1Data);
                if (iconData) {
                    ribbon1.innerHTML = iconData.type === 'emoji' ? iconData.content : `<img src="${iconData.content}" alt="${element1Data.element_name}">`;
                }
            }
        }
        
        if (elementArray[1] !== null && elementArray[1] !== undefined) {
            const element2 = ElementDataManager.getElementById(elementArray[1]);
            if (element2) {
                const iconData = ElementDataManager.resolveElementIcon(element2);
                if (iconData) {
                    ribbon2.innerHTML = iconData.type === 'emoji' ? iconData.content : `<img src="${iconData.content}" alt="${element2.element_name}">`;
                }
            }
        }
    },

    editMonsterName() {
        const data = getSaveData();
        if (data && data.monster) {
            const newName = prompt('請輸入新的寵物名稱:', data.monster.name);
            if (newName && newName.trim() !== '') {
                data.monster.name = newName.trim();
                saveGame(data);
                this.updateMonsterDisplay();
            }
        }
    },

    disableButtons() {
        const buttons = ['btn-feed', 'btn-bath', 'btn-clean', 'btn-interact', 'btn-skills', 'btn-evolve', 'btn-room'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = true;
        });
    },

    enableButtons() {
        const buttons = ['btn-feed', 'btn-bath', 'btn-clean', 'btn-interact', 'btn-skills', 'btn-evolve', 'btn-room'];
        buttons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
    },

    feedMonster() {
        const data = getSaveData();
        if (!data || !data.monster) { alert('沒有寵物資料，請先建立存檔'); return; }
        
        if (data.monster.stm >= 100) {
            ResultPopup.show('寵物已經飽了！');
            return;
        }
        
        const currentTime = Date.now();
        const feedResetTime = data.monster.feed_reset_time || 0;
        
        if (currentTime < feedResetTime) {
            const remainingSeconds = Math.ceil((feedResetTime - currentTime) / 1000);
            ResultPopup.show(`寵物還沒餓！${remainingSeconds}秒後可餵食`);
            return;
        }
        
        if (data.gold < 10) {
            alert('金幣不足！需要 10 金幣');
            return;
        }
        
        const food = FoodDataManager.getRandomFood();
        if (!food) {
            alert('無法取得食物');
            return;
        }
        
        this.disableButtons();
        
        data.monster.feed_reset_time = currentTime + (1.5 * 60 * 1000);
        
        const goldCost = 10;
        
        GoldChangeAnimator.show(-goldCost);
        
        const monster_image_name = this.currentMonsterImageName;
        const food_image_name = food.image_folder;
        const max_frame = food.animation_frames - 1;
        
        let monster_index = 0;
        let food_index = 0;
        
        const monsterSprite = document.querySelector('.monster-image .monster-sprite img');
        
        const cached = monster_image_name ? SpriteAnimator.getCachedImages(monster_image_name) : null;
        
        const updateImages = () => {
            if (monsterSprite && cached) {
                monsterSprite.src = monster_index === 1 ? cached.frame1.src : cached.frame2.src;
            } else if (monsterSprite) {
                monsterSprite.src = `datas/images/monster/${monster_image_name}/${monster_image_name}_${monster_index}.png`;
            }
            FoodAnimator.updateFrame(food_index);
        };
        
        FoodAnimator.show(food_image_name);
        
        const playNext = () => {
            if (food_index >= max_frame) {
                FoodAnimator.stop();
                
                const effects = FoodEffectParser.parse(food.food_effect);
                const results = FoodEffectParser.apply(effects);
                this.applyFeedResults(data, results, goldCost);
                return;
            }
            
            monster_index = 2;
            updateImages();
            
            setTimeout(() => {
                monster_index = 1;
                food_index++;
                updateImages();
                
                setTimeout(playNext, 300);
            }, 300);
        };
        
        playNext();
    },

    applyFeedResults(data, results, goldCost) {
        let resultTexts = [];
        
        for (const [stat, value] of Object.entries(results)) {
            if (stat === 'hp') {
                data.monster.hp = Math.min(data.monster.hp + value, data.monster.maxhp);
                if (value > 0) resultTexts.push(`HP +${value}`);
            } else if (stat === 'exp') {
                data.monster.exp += value;
                if (value > 0) resultTexts.push(`EXP +${value}`);
            } else if (stat === 'stm') {
                data.monster.stm = Math.min((data.monster.stm || 0) + value, 100);
                if (value > 0) resultTexts.push(`飽足 +${value}`);
            }
        }
        
        data.gold -= goldCost;
        
        if (data.monster.exp >= data.monster.expToNextLevel) {
            const levelUpResult = checkLevelUp(data.monster);
            if (levelUpResult.leveledUp) {
                levelUpResult.newStats = {
                    name: data.monster.name,
                    str: data.monster.str,
                    int: data.monster.int,
                    def: data.monster.def,
                    dex: data.monster.dex,
                    cha: data.monster.cha,
                    maxhp: data.monster.maxhp
                };
                saveGame(data);
                showLevelUpPopup(levelUpResult, () => {
                    this.enableButtons();
                    this.updateMonsterDisplay();
                });
                return;
            }
        }
        
        saveGame(data);
        
        document.getElementById('monster-hp').textContent = data.monster.hp;
        document.getElementById('monster-max-hp').textContent = data.monster.maxhp;
        document.getElementById('monster-exp').textContent = data.monster.exp;
        const expPercent = ((data.monster.exp || 0) / (data.monster.expToNextLevel || 1)) * 100;
        document.getElementById('exp-bar').style.width = expPercent + '%';
        document.getElementById('monster-level').textContent = data.monster.lv;
        document.getElementById('monster-exp-max').textContent = data.monster.expToNextLevel;
        document.getElementById('monster-stm').textContent = data.monster.stm || 100;
        document.getElementById('stm-bar').style.width = (data.monster.stm || 100) + '%';
        
        if (resultTexts.length > 0) {
            ResultPopup.show(resultTexts.join(' '));
        }
        
        this.enableButtons();
    },

    bathMonster() {
        const data = getSaveData();
        if (!data || !data.monster) { alert('沒有寵物資料，請先建立存檔'); return; }
        
        if (data.monster.clean >= 100) {
            ResultPopup.show('寵物已經很乾淨了！');
            return;
        }
        
        data.monster.clean = 100;
        const affectionGain = Math.floor(Math.random() * 5) + 1;
        const leveledUp = addAffection(data.monster, affectionGain);
        
        saveGame(data);
        this.updateMonsterDisplay();
        
        let resultText = `好感度 +${affectionGain}`;
        if (leveledUp) {
            resultText += ' 好感度升級！';
        }
        ResultPopup.show(resultText);
    },

    toiletMonster() {
        const data = getSaveData();
        if (!data || !data.monster) { alert('沒有寵物資料，請先建立存檔'); return; }
        
        const unchiCount = data.monster.unchi || 0;
        
        if (unchiCount <= 0) {
            ResultPopup.show('沒有大便需要清理！');
            return;
        }
        
        let affectionTotal = 0;
        let expTotal = 0;
        
        for (let i = 0; i < unchiCount; i++) {
            affectionTotal += Math.floor(Math.random() * 4) + 2;
            expTotal += Math.floor(Math.random() * 16) + 10;
        }
        data.monster.unchi = 0;
        
        if (affectionTotal > 0) {
            data.monster.affection_exp = (data.monster.affection_exp || 0) + affectionTotal;
        }
        
        const leveledUp = checkAffectionLevelUp(data.monster);
        
        if (expTotal > 0) {
            data.monster.exp = (data.monster.exp || 0) + expTotal;
            const expLevelUpResult = checkLevelUp(data.monster);
            if (expLevelUpResult.leveledUp) {
                expLevelUpResult.newStats = {
                    name: data.monster.name,
                    str: data.monster.str,
                    int: data.monster.int,
                    def: data.monster.def,
                    dex: data.monster.dex,
                    cha: data.monster.cha,
                    maxhp: data.monster.maxhp
                };
                saveGame(data);
                this.updateMonsterDisplay();
                showLevelUpPopup(expLevelUpResult, () => {
                    this.updateMonsterDisplay();
                });
                return;
            }
        }
        
        saveGame(data);
        this.updateMonsterDisplay();
        
        let resultText = `清理了${unchiCount}個大便！`;
        resultText += ` 好感度 +${affectionTotal}，經驗值 +${expTotal}`;
        if (leveledUp) {
            resultText += ' 好感度升級！';
        }
        ResultPopup.show(resultText);
    },

    interactMonster() {
        const data = getSaveData();
        if (!data || !data.monster) { alert('沒有寵物資料，請先建立存檔'); return; }
        data.monster.exp += 3;
        const levelUpResult = checkLevelUp(data.monster);
        saveGame(data);
        
        if (levelUpResult.leveledUp) {
            levelUpResult.newStats = {
                name: data.monster.name,
                str: data.monster.str,
                int: data.monster.int,
                def: data.monster.def,
                dex: data.monster.dex,
                cha: data.monster.cha,
                maxhp: data.monster.maxhp
            };
            showLevelUpPopup(levelUpResult, () => {
                this.updateMonsterDisplay();
            });
        } else {
            alert('互動成功！獲得 3 經驗值');
            this.updateMonsterDisplay();
        }
    },

    showSkillsModal() {
        const data = getSaveData();
        if (!data || !data.monster) { alert('沒有寵物資料，請先建立存檔'); return; }
        
        const skillIds = data.monster.skill_id || [];
        const skills = [];
        skillIds.forEach(skillId => {
            const skill = SkillDataManager.getSkillById(skillId);
            if (skill) skills.push(skill);
        });
        
        let html = '<div id="skills-modal" class="modal"><div class="modal-content"><h3>技能</h3>';
        
        if (skills.length > 0) {
            skills.forEach(skill => {
                html += `<div class="skill-item"><span class="skill-name">${skill.name}</span><span class="skill-desc">${skill.desc || '無描述'}</span></div>`;
            });
        } else {
            html += '<p>尚未習得技能</p>';
        }
        
        html += '<button id="close-skills-modal">關閉</button></div></div>';
        
        document.getElementById('app').insertAdjacentHTML('beforeend', html);
        
        document.getElementById('close-skills-modal').addEventListener('click', () => {
            document.getElementById('skills-modal').remove();
        });
    },

    showEvolveModal() {
        const data = getSaveData();
        if (!data || !data.monster) { alert('沒有寵物資料'); return; }
        
        if (!MonsterDataManager.canEvolve(data.monster.id)) {
            alert('此寵物無法進化');
            return;
        }
        
        const evolutions = MonsterDataManager.getNextEvolutions(data.monster.id);
        
        let html = '<div id="evolve-modal" class="modal"><div class="modal-content"><h3>進化</h3>';
        
        evolutions.forEach(evo => {
            html += `<div class="evolve-item" data-evo-id="${evo.id}">
                <span>${evo.name}</span>
                <button class="btn-evolve">進化</button>
            </div>`;
        });
        
        html += '<button id="close-evolve-modal">關閉</button></div></div>';
        
        document.getElementById('app').insertAdjacentHTML('beforeend', html);
        
        document.getElementById('close-evolve-modal').addEventListener('click', () => {
            document.getElementById('evolve-modal').remove();
        });
        
        document.querySelectorAll('.btn-evolve').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const evoId = e.target.closest('.evolve-item').dataset.evoId;
                this.doEvolve(evoId);
            });
        });
    },

    doEvolve(evoId) {
        const data = getSaveData();
        if (!data || !data.monster) return;
        
        const evoMonster = MonsterDataManager.getMonsterById(evoId);
        if (!evoMonster) return;
        
        data.monster.id = evoMonster.id;
        data.monster.name = evoMonster.name;
        data.monster.image_name = evoMonster.image_name;
        data.monster.element = evoMonster.element;
        data.monster.skill_id = evoMonster.skill_id;
        
        const stats = MonsterDataManager.calculateStats(evoMonster.id, data.monster.lv);
        if (stats) {
            data.monster.maxhp = stats.maxhp;
            data.monster.hp = stats.maxhp;
            data.monster.str = stats.str;
            data.monster.def = stats.def;
            data.monster.dex = stats.dex;
            data.monster.int = stats.int;
            data.monster.cha = stats.cha;
        }
        
        saveGame(data);
        document.getElementById('evolve-modal')?.remove();
        alert(`恭喜！寵物進化為 ${evoMonster.name}！`);
        this.updateMonsterDisplay();
    },

    showRoomModal() {
        const data = getSaveData();
        if (!data || !data.monster) { alert('沒有寵物資料'); return; }
        
        const rooms = RoomDataManager.getAllRooms();
        const currentRoom = data.monster.room || 'forest';
        
        let html = '<div id="room-modal" class="modal"><div class="modal-content"><h3>選擇房間</h3>';
        
        rooms.forEach(room => {
            const isOpen = (data.openRooms || []).includes(room.roomId) || room.roomId === 'forest';
            const isCurrent = room.roomId === currentRoom;
            
            html += `<div class="room-item ${isCurrent ? 'current' : ''}" data-room-id="${room.roomId}">
                <span>${room.name}</span>
                ${isCurrent ? '<span>目前</span>' : (isOpen ? `<button class="btn-select-room">選擇</button>` : '<span>🔒</span>')}
            </div>`;
        });
        
        html += '<button id="close-room-modal">關閉</button></div></div>';
        
        document.getElementById('app').insertAdjacentHTML('beforeend', html);
        
        document.getElementById('close-room-modal').addEventListener('click', () => {
            document.getElementById('room-modal').remove();
        });
        
        document.querySelectorAll('.btn-select-room').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomId = e.target.closest('.room-item').dataset.roomId;
                this.selectRoom(roomId);
            });
        });
    },

    selectRoom(roomId) {
        const data = getSaveData();
        if (!data || !data.monster) return;
        
        data.monster.room = roomId;
        
        if (!data.openRooms) data.openRooms = [];
        if (!data.openRooms.includes(roomId)) {
            data.openRooms.push(roomId);
        }
        
        saveGame(data);
        document.getElementById('room-modal')?.remove();
        this.updateMonsterDisplay();
    }
};

window.TrainingPage = TrainingPage;
