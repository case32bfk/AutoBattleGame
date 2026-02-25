const StartPage = {
    isGameReady: false,
    
    getHTML() {
        return `
            <div id="title-screen">
                <h1>自動戰鬥遊戲</h1>
                <div class="content-container">
                    <div class="menu-buttons">
                        <button id="btn-start">開始遊戲</button>
                        <button id="btn-load">讀取存檔</button>
                        <button id="btn-save">輸出存檔</button>
                        <button id="btn-dev" style="background-color: #666; display: none;">Dev - 檢查存檔</button>
                    </div>
                </div>
            </div>
        `;
    },

    mount(container) {
        container.innerHTML = this.getHTML();
        this.bindEvents();
    },

    unmount() {
    },

    bindEvents() {
        document.getElementById('btn-start').addEventListener('click', () => {
            if (!StartPage.isGameReady) {
                alert('遊戲尚未載入完成，請稍後再試');
                return;
            }
            if (!checkSaveExists()) {
                initSaveData();
            }
            Router.navigate('training');
        });

        document.getElementById('btn-load').addEventListener('click', () => {
            if (!StartPage.isGameReady) {
                alert('遊戲尚未載入完成，請稍後再試');
                return;
            }
            document.getElementById('file-input').click();
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            if (!checkSaveExists()) {
                alert('沒有可匯出的存檔');
                return;
            }
            exportSaveData();
            alert('存檔已匯出');
        });

        document.getElementById('file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                importSaveData(file, (data) => {
                    alert('存檔載入成功！');
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

        window.devmode = function() {
            document.getElementById('btn-dev').style.display = 'block';
            console.log('Dev mode enabled');
        };
    },

    setReady(ready) {
        this.isGameReady = ready;
    }
};

window.StartPage = StartPage;
