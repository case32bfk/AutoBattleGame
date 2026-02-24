const GameNavigation = {
    currentPage: null,

    init(currentPage) {
        this.currentPage = currentPage;
        this.renderHeader(currentPage);
        this.renderFooter(currentPage);
        this.setupNavigationEvents();
        this.updateGoldDisplay();
    },

    getHeaderHTML(pageTitle, showBackButton = false) {
        return `
            <div class="screen-header">
                ${showBackButton ? '<button id="btn-back" class="back-btn">← 返回</button>' : ''}
                <h2>${pageTitle}</h2>
                <div class="gold-display">💰 <span id="gold-count" class="gold-current">0</span></div>
            </div>
        `;
    },

    getFooterHTML() {
        return `
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
                <button class="nav-btn" id="nav-system">
                    <span class="nav-icon">⚙️</span>
                    <span class="nav-label">系統</span>
                </button>
            </div>
        `;
    },

    renderHeader(pageTitle, showBackButton = false) {
        const container = document.querySelector('#game-container');
        let headerEl = container.querySelector('.screen-header');
        
        if (headerEl) {
            headerEl.outerHTML = this.getHeaderHTML(pageTitle, showBackButton);
        } else {
            const screenEl = container.querySelector('[id$="-screen"]');
            if (screenEl) {
                screenEl.insertAdjacentHTML('afterbegin', this.getHeaderHTML(pageTitle, showBackButton));
            }
        }

        if (showBackButton) {
            const backBtn = document.getElementById('btn-back');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    window.location.href = '../Start.html';
                });
            }
        }
    },

    renderFooter() {
        const container = document.querySelector('#game-container');
        let footerEl = container.querySelector('.footer-nav');
        
        if (footerEl) {
            footerEl.outerHTML = this.getFooterHTML();
        } else {
            container.insertAdjacentHTML('beforeend', this.getFooterHTML());
        }

        this.updateActiveState();
    },

    setupNavigationEvents() {
        document.getElementById('nav-training')?.addEventListener('click', () => {
            window.location.href = 'Training.html';
        });

        document.getElementById('nav-hunt')?.addEventListener('click', () => {
            window.location.href = 'Battle.html';
        });

        document.getElementById('nav-gacha')?.addEventListener('click', () => {
            alert('轉蛋功能尚未開放');
        });

        document.getElementById('nav-system')?.addEventListener('click', () => {
            window.location.href = 'System.html';
        });
    },

    updateActiveState() {
        const pageMap = {
            'Training': 'nav-training',
            'Battle': 'nav-hunt',
            'System': 'nav-system'
        };

        const activeId = pageMap[this.currentPage];
        if (activeId) {
            const activeBtn = document.getElementById(activeId);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        }
    },

    updateGoldDisplay() {
        const goldCountEl = document.getElementById('gold-count');
        if (goldCountEl && typeof getSaveData === 'function') {
            try {
                const data = getSaveData();
                goldCountEl.textContent = data ? (data.gold || 0) : 0;
            } catch (e) {
                goldCountEl.textContent = '0';
            }
        }
    }
};

window.GameNavigation = GameNavigation;
