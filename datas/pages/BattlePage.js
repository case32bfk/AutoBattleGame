const BattlePage = {
    currentEnemy: null,
    intervalId: null,
    
    getHTML() {
        return `
            <div id="battle-screen">
                <div class="screen-header">
                    <h2>戰鬥</h2>
                    <div class="gold-display" style="display: none;">💰 <span id="gold-count" class="gold-current">0</span></div>
                </div>
                <div class="battle-field">
                    <div class="enemy-side">
                        <div id="enemy-monster">
                            <div class="battle-image" id="enemy-image">
                                <div class="room-background"></div>
                                <div class="monster-sprite"></div>
                            </div>
                            <div class="battle-status" id="enemy-status">
                                <div class="status-name" id="enemy-name">---</div>
                                <div class="status-lv">Lv.<span id="enemy-lv">1</span></div>
                                <div class="status-hp">
                                    <span class="hp-label">HP</span>
                                    <span id="enemy-hp">0</span> / <span id="enemy-max-hp">0</span>
                                </div>
                                <div class="status-stats">
                                    <span class="stat-atk">力 <span id="enemy-str">0</span></span>
                                    <span class="stat-int">智 <span id="enemy-int">0</span></span>
                                    <span class="stat-def">體 <span id="enemy-def">0</span></span>
                                    <span class="stat-speed">速 <span id="enemy-dex">0</span></span>
                                    <span class="stat-cha">美 <span id="enemy-cha">0</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="player-side">
                        <div id="player-monster">
                            <div class="battle-image" id="player-image">
                                <div class="room-background"></div>
                                <div class="monster-sprite"></div>
                            </div>
                            <div class="battle-status" id="player-status">
                                <div class="status-name" id="player-name">---</div>
                                <div class="status-lv">Lv.<span id="player-lv">1</span></div>
                                <div class="status-hp">
                                    <span class="hp-label">HP</span>
                                    <span id="player-hp">0</span> / <span id="player-max-hp">0</span>
                                </div>
                                <div class="status-stats">
                                    <span class="stat-atk">力 <span id="player-str">0</span></span>
                                    <span class="stat-int">智 <span id="player-int">0</span></span>
                                    <span class="stat-def">體 <span id="player-def">0</span></span>
                                    <span class="stat-speed">速 <span id="player-dex">0</span></span>
                                    <span class="stat-cha">美 <span id="player-cha">0</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="battle-log" id="battle-log" style="width: 100%;">
                </div>
                <div class="battle-controls">
                    <div class="control-label">操作功能</div>
                    <div class="control-buttons">
                        <button id="btn-advance" class="control-btn">前進</button>
                        <div class="auto-toggle">
                            <span class="toggle-label">自動</span>
                            <label class="switch">
                                <input type="checkbox" id="btn-auto">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            <div id="battle-footer" class="footer-nav">
                <button class="nav-btn" id="nav-training">
                    <span class="nav-icon">🏠</span>
                    <span class="nav-label">培養</span>
                </button>
                <button class="nav-btn active" id="nav-hunt">
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
        await this.initBattle();
    },

    unmount() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    async bindEvents() {
        document.getElementById('btn-advance').addEventListener('click', () => {
            BattleSystem.onPlayerAdvance();
        });

        document.getElementById('btn-auto').addEventListener('change', (e) => {
            BattleSystem.setAutoMode(e.target.checked);
        });

        document.getElementById('nav-training').addEventListener('click', () => Router.navigate('training'));
        document.getElementById('nav-system').addEventListener('click', () => Router.navigate('system'));
        document.getElementById('nav-gacha').addEventListener('click', () => alert('轉蛋功能尚未開放'));
    },

    async initBattle() {
        await MapDataManager.loadMaps();
        
        const map = MapDataManager.getRandomMap();
        MapDataManager.setCurrentMap(map);
        
        const data = getSaveData();
        if (!data || !data.monster) {
            alert('沒有寵物資料，請先建立存檔');
            Router.navigate('training');
            return;
        }
        
        if (data.monster.image_name) {
            await SpriteAnimator.preload(data.monster.image_name);
        }
        
        this.updatePlayerDisplay(data.monster);
        
        const enemyMonster = MapDataManager.getRandomMonster(map);
        if (enemyMonster.image_name) {
            await SpriteAnimator.preload(enemyMonster.image_name);
        }
        this.updateEnemyDisplay(enemyMonster);
        
        BattleSystem.init((event, evtData) => {
            console.log('Battle event:', event, evtData);
            this.handleBattleEvent(event, evtData);
        });
        
        BattleSystem.startBattle(data.monster, enemyMonster);
    },

    handleBattleEvent(event, data) {
        const battleLog = document.getElementById('battle-log');
        
        switch(event) {
            case 'playerAttack':
                battleLog.innerHTML += `<p>${data.player} 攻擊造成 ${data.damage} 傷害！</p>`;
                break;
            case 'enemyAttack':
                battleLog.innerHTML += `<p>${data.enemy} 攻擊造成 ${data.damage} 傷害！</p>`;
                break;
            case 'playerWin':
                battleLog.innerHTML += `<p class="win">戰鬥勝利！獲得 ${data.gold} 金幣</p>`;
                break;
            case 'enemyWin':
                battleLog.innerHTML += `<p class="lose">戰鬥失敗...</p>`;
                break;
            case 'playerHpChange':
                document.getElementById('player-hp').textContent = data.hp;
                break;
            case 'enemyHpChange':
                document.getElementById('enemy-hp').textContent = data.hp;
                break;
        }
        
        battleLog.scrollTop = battleLog.scrollHeight;
    },

    updatePlayerDisplay(m) {
        document.getElementById('player-name').textContent = m.name || '未知';
        document.getElementById('player-lv').textContent = m.lv || 1;
        document.getElementById('player-hp').textContent = m.hp || 0;
        document.getElementById('player-max-hp').textContent = m.maxhp || 100;
        document.getElementById('player-str').textContent = m.str || 0;
        document.getElementById('player-int').textContent = m.int || 0;
        document.getElementById('player-def').textContent = m.def || 0;
        document.getElementById('player-dex').textContent = m.dex || 0;
        document.getElementById('player-cha').textContent = m.cha || 0;
        
        const roomId = m.room || 'forest';
        const roomData = RoomDataManager.getRoomById(roomId);
        const playerImageEl = document.querySelector('#player-image .room-background');
        if (roomData && roomData.image && playerImageEl) {
            playerImageEl.style.backgroundImage = `url('datas/images/rooms/${roomData.image}.png')`;
        }
        
        const playerSprite = document.querySelector('#player-image .monster-sprite');
        const playerMonsterData = MonsterDataManager.getMonsterById(m.id);
        
        const cached = playerMonsterData && playerMonsterData.image_name ? SpriteAnimator.getCachedImages(playerMonsterData.image_name) : null;
        
        if (playerMonsterData && playerMonsterData.image_name) {
            if (cached) {
                playerSprite.innerHTML = `<img src="${cached.frame1.src}" alt="${m.name}">`;
            } else {
                playerSprite.innerHTML = `<img src="datas/images/monster/${playerMonsterData.image_name}/${playerMonsterData.image_name}_1.png" alt="${m.name}">`;
            }
        } else if (m.image_emoji) {
            playerSprite.innerHTML = '';
            playerSprite.textContent = m.image_emoji;
        } else if (m.image_name) {
            playerSprite.innerHTML = `<img src="datas/images/monster/${m.image_name}/${m.image_name}_1.png" alt="${m.name}">`;
        } else {
            playerSprite.innerHTML = '';
            playerSprite.textContent = '🐉';
        }
    },

    updateEnemyDisplay(enemyMonster) {
        if (!enemyMonster) return;
        
        document.getElementById('enemy-name').textContent = enemyMonster.name || '敵人';
        document.getElementById('enemy-lv').textContent = enemyMonster.lv || 1;
        document.getElementById('enemy-hp').textContent = enemyMonster.hp || 0;
        document.getElementById('enemy-max-hp').textContent = enemyMonster.maxhp || 100;
        document.getElementById('enemy-str').textContent = enemyMonster.str || 0;
        document.getElementById('enemy-int').textContent = enemyMonster.int || 0;
        document.getElementById('enemy-def').textContent = enemyMonster.def || 0;
        document.getElementById('enemy-dex').textContent = enemyMonster.dex || 0;
        document.getElementById('enemy-cha').textContent = enemyMonster.cha || 0;
        
        const map = MapDataManager.getCurrentMap();
        const roomId = map ? 'forest' : 'forest';
        const enemyRoomData = RoomDataManager.getRoomById(roomId);
        const enemyImageEl = document.querySelector('#enemy-image .room-background');
        if (enemyRoomData && enemyRoomData.image && enemyImageEl) {
            enemyImageEl.style.backgroundImage = `url('datas/images/rooms/${enemyRoomData.image}.png')`;
        }
        
        const enemySprite = document.querySelector('#enemy-image .monster-sprite');
        const enemyMonsterData = MonsterDataManager.getMonsterById(enemyMonster.id);
        
        const cached = enemyMonsterData && enemyMonsterData.image_name ? SpriteAnimator.getCachedImages(enemyMonsterData.image_name) : null;
        
        if (enemyMonsterData && enemyMonsterData.image_name) {
            if (cached) {
                enemySprite.innerHTML = `<img src="${cached.frame1.src}" alt="${enemyMonster.name}">`;
            } else {
                enemySprite.innerHTML = `<img src="datas/images/monster/${enemyMonsterData.image_name}/${enemyMonsterData.image_name}_1.png" alt="${enemyMonster.name}">`;
            }
        } else if (enemyMonster.image_emoji) {
            enemySprite.innerHTML = '';
            enemySprite.textContent = enemyMonster.image_emoji;
        } else if (enemyMonster.image_name) {
            enemySprite.innerHTML = `<img src="datas/images/monster/${enemyMonster.image_name}/${enemyMonster.image_name}_1.png" alt="${enemyMonster.name}">`;
        } else {
            enemySprite.innerHTML = '';
            enemySprite.textContent = '👾';
        }
        
        this.currentEnemy = enemyMonster;
    }
};

window.BattlePage = BattlePage;
