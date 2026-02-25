const SystemPage = {
    getHTML() {
        return `
            <div id="system-screen">
                <div class="screen-header">
                    <button id="btn-back" style="background-color: #e94560;">返回標題</button>
                    <h2>系統</h2>
                    <button id="btn-dev" style="background-color: #666; padding: 10px 15px; font-size: 14px; width: auto; min-width: auto; display: none;">Dev</button>
                </div>
                <div class="system-content">
                    <div class="system-section">
                        <h3>遊戲資訊</h3>
                        <div class="info-row">
                            <span>金幣</span>
                            <span id="gold-count">0</span>
                        </div>
                    </div>
                    <div class="system-section">
                        <h3>設定</h3>
                        <button id="btn-reset" class="system-btn">重置遊戲</button>
                        <button id="btn-export" class="system-btn">匯出存檔</button>
                        <button id="btn-import" class="system-btn">匯入存檔</button>
                    </div>
                </div>
                <input type="file" id="file-input" accept=".json" style="display: none;">
            </div>
            <div class="footer-nav">
                <button class="nav-btn" id="nav-training">
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
                <button class="nav-btn active" id="nav-system">
                    <span class="nav-icon">⚙️</span>
                    <span class="nav-label">系統</span>
                </button>
            </div>
        `;
    },

    mount(container) {
        container.innerHTML = this.getHTML();
        this.bindEvents();
        this.updateDisplay();
    },

    unmount() {
    },

    bindEvents() {
        document.getElementById('btn-back').addEventListener('click', () => {
            window.location.href = 'Start.html';
        });

        document.getElementById('nav-training').addEventListener('click', () => Router.navigate('training'));
        document.getElementById('nav-hunt').addEventListener('click', () => Router.navigate('battle'));
        document.getElementById('nav-gacha').addEventListener('click', () => alert('轉蛋功能尚未開放'));

        document.getElementById('btn-reset').addEventListener('click', () => {
            if (confirm('確定要重置遊戲嗎？所有資料將會清除！')) {
                localStorage.removeItem('autoBattleGame_saveData');
                alert('遊戲已重置');
                window.location.href = 'Start.html';
            }
        });

        document.getElementById('btn-export').addEventListener('click', () => {
            if (!checkSaveExists()) {
                alert('沒有可匯出的存檔');
                return;
            }
            exportSaveData();
            alert('存檔已匯出');
        });

        document.getElementById('btn-import').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importSaveData(file, (data) => {
                    alert('存檔載入成功！');
                    this.updateDisplay();
                });
            }
        });

        document.getElementById('btn-dev').addEventListener('click', () => {
            if (checkSaveExists()) {
                const data = getSaveData();
                alert('存檔存在！\n金幣: ' + data.gold);
            } else {
                alert('存檔不存在');
            }
        });
    },

    updateDisplay() {
        const data = getSaveData();
        document.getElementById('gold-count').textContent = data ? (data.gold || 0) : 0;
    }
};

window.SystemPage = SystemPage;
