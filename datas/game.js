const SaveData = {
    gold: 0,
    monster: null,
    gameProgress: {
        totalBattles: 0,
        wins: 0,
        losses: 0
    }
};

const SAVE_KEYS = {
    GOLD: 'autoBattleGame_gold',
    MONSTER: 'autoBattleGame_monster',
    GAME_PROGRESS: 'autoBattleGame_gameProgress',
    OPEN_ROOMS: 'autoBattleGame_openRooms'
};

function getSaveData() {
    const gold = localStorage.getItem(SAVE_KEYS.GOLD);
    const monster = localStorage.getItem(SAVE_KEYS.MONSTER);
    const gameProgress = localStorage.getItem(SAVE_KEYS.GAME_PROGRESS);
    const openRooms = localStorage.getItem(SAVE_KEYS.OPEN_ROOMS);
    
    if (!gold && !monster) return null;
    
    return {
        gold: gold ? parseInt(gold) : 0,
        monster: monster ? JSON.parse(monster) : null,
        gameProgress: gameProgress ? JSON.parse(gameProgress) : { totalBattles: 0, wins: 0, losses: 0 },
        openRooms: openRooms ? JSON.parse(openRooms) : []
    };
}

function saveGame(data) {
    if (data.gold !== undefined) {
        localStorage.setItem(SAVE_KEYS.GOLD, data.gold.toString());
    }
    if (data.monster) {
        localStorage.setItem(SAVE_KEYS.MONSTER, JSON.stringify(data.monster));
    }
    if (data.gameProgress) {
        localStorage.setItem(SAVE_KEYS.GAME_PROGRESS, JSON.stringify(data.gameProgress));
    }
    if (data.openRooms) {
        localStorage.setItem(SAVE_KEYS.OPEN_ROOMS, JSON.stringify(data.openRooms));
    }
}

function loadSaveData() {
    return getSaveData();
}

function checkSaveExists() {
    return localStorage.getItem(SAVE_KEYS.GOLD) !== null || 
           localStorage.getItem(SAVE_KEYS.MONSTER) !== null;
}

function createDefaultMonster() {
    if (typeof MonsterDataManager !== 'undefined' && MonsterDataManager.getMonsterById) {
        const slimeMonster = MonsterDataManager.getMonsterById('slime_001');
        if (slimeMonster && slimeMonster.base_stats) {
            return {
                id: slimeMonster.id,
                name: slimeMonster.name,
                element: [slimeMonster.element !== undefined ? slimeMonster.element : 0, null],
                image_name: slimeMonster.image_name,
                image_emoji: '💧',
                lv: 1,
                exp: 0,
                expToNextLevel: calculateExpToNextLevel(1),
                hp: slimeMonster.base_stats.hp,
                maxhp: slimeMonster.base_stats.hp,
                str: slimeMonster.base_stats.str || 10,
                def: slimeMonster.base_stats.def || 8,
                dex: slimeMonster.base_stats.dex || 10,
                int: slimeMonster.base_stats.int || 5,
                cha: slimeMonster.base_stats.cha || 5,
                potential: 0,
                skill_id: Array.isArray(slimeMonster.skill_id) ? slimeMonster.skill_id : [slimeMonster.skill_id],
                room: 'forest',
                feed_reset_time: 0,
                stm: 100,
                clean: 100,
                unchiTimer: 0,
                unchi: 0,
                affection_lv: 1,
                affection_exp: 0
            };
        }
    }
    
    return {
        id: "slime_001",
        name: "小火龍",
        element: [0, null],
        image_name: "slime",
        image_emoji: '💧',
        lv: 1,
        exp: 0,
        expToNextLevel: calculateExpToNextLevel(1),
        hp: 100,
        maxhp: 100,
        str: 15,
        def: 10,
        dex: 12,
        int: 8,
        cha: 8,
        potential: 0,
        skill_id: ["fire_1"],
        room: 'forest',
        feed_reset_time: 0,
        stm: 100,
        clean: 100,
        unchiTimer: 0,
        unchi: 0,
        affection_lv: 1,
        affection_exp: 0
    };
}

function initSaveData() {
    const monster = createDefaultMonster();
    const newData = {
        gold: 100,
        monster: monster,
        openRooms: ['forest', 'desert'],
        gameProgress: {
            totalBattles: 0,
            wins: 0,
            losses: 0
        },
        createdAt: new Date().toISOString()
    };
    saveGame(newData);
    return newData;
}

function exportSaveData() {
    const data = getSaveData();
    if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'save_data.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

function clearAllSaveData() {
    localStorage.removeItem(SAVE_KEYS.GOLD);
    localStorage.removeItem(SAVE_KEYS.MONSTER);
    localStorage.removeItem(SAVE_KEYS.GAME_PROGRESS);
    localStorage.removeItem(SAVE_KEYS.OPEN_ROOMS);
}

function importSaveData(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            saveGame(data);
            if (callback) callback(data);
        } catch (error) {
            alert('存檔格式錯誤');
        }
    };
    reader.readAsText(file);
}

function calculateExpToNextLevel(level) {
    return Math.floor(level * 100 + level * level / 2 * 25);
}

function checkLevelUp(monster) {
    const expToNext = calculateExpToNextLevel(monster.lv);
    monster.expToNextLevel = expToNext;
    
    if (monster.exp >= monster.expToNextLevel) {
        const oldLv = monster.lv;
        const oldStats = {
            str: monster.str || 0,
            int: monster.int || 0,
            def: monster.def || 0,
            dex: monster.dex || 0,
            cha: monster.cha || 0,
            maxhp: monster.maxhp || 0
        };
        
        monster.lv += 1;
        monster.exp = monster.exp - monster.expToNextLevel;
        monster.expToNextLevel = calculateExpToNextLevel(monster.lv);
        
        if (!monster.potential) monster.potential = 0;
        
        const levelUpResult = processLevelUpStats(monster, false);
        
        monster.hp = monster.maxhp;
        
        return {
            leveledUp: true,
            oldLv: oldLv,
            newLv: monster.lv,
            oldStats: oldStats,
            newStats: {
                str: monster.str || 0,
                int: monster.int || 0,
                def: monster.def || 0,
                dex: monster.dex || 0,
                cha: monster.cha || 0,
                maxhp: monster.maxhp || 0
            },
            awakened: levelUpResult.awakened,
            increases: levelUpResult.increases
        };
    }
    return { leveledUp: false };
}

function processLevelUpStats(monster, processAwaken) {
    if (!monster.potential) monster.potential = 0;
    
    console.log('=== 升級能力值計算 ===');
    console.log('原有 potential:', monster.potential);
    
    const increases = {
        str: 0,
        int: 0,
        def: 0,
        dex: 0,
        cha: 0
    };
    
    const tempStatus = Math.floor(Math.random() * 5) + 3;
    console.log('隨機 tempStatus:', tempStatus, '(範圍 3~7)');
    
    if (tempStatus < 7) {
        const potentialGain = 7 - tempStatus;
        monster.potential += potentialGain;
        console.log(`tempStatus < 7，potential +${potentialGain}`);
    }
    
    let pointsToDistribute = tempStatus;
    console.log('可分配點數:', pointsToDistribute);
    
    const stats = ['str', 'int', 'def', 'dex', 'cha'];
    const statNames = { str: '力', int: '智', def: '體', dex: '速', cha: '美' };
    
    for (let i = 0; i < pointsToDistribute; i++) {
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        monster[randomStat] = (monster[randomStat] || 0) + 1;
        increases[randomStat]++;
        
        if (randomStat === 'def') {
            monster.maxhp = (monster.maxhp || 0) + 3;
            console.log(`  分配 ${statNames[randomStat]}: +1 (體質影響 maxhp+3)`);
        } else {
            console.log(`  分配 ${statNames[randomStat]}: +1`);
        }
    }
    
    console.log('能力值增加:', increases);
    
    let awakened = false;
    
    if (processAwaken) {
        console.log('--- 潛力覺醒判定 ---');
        const awakenChance = Math.random() * 100;
        console.log('覺醒隨機值:', awakenChance, '門檻: 200 (測試中)');
        
        if (awakenChance < 200) { //測試：200
            awakened = true;
            console.log('>>> 觸發潛力覺醒！ <<<');
            
            const awakenRate = 0.25 + Math.random() * 0.15;
            console.log('覺醒倍率:', awakenRate, '(範圍 0.25~0.4)');
            
            const beforePotential = monster.potential;
            const awakenPoints = Math.floor(monster.potential * awakenRate);
            monster.potential -= awakenPoints;
            console.log(`覺醒分配前 potential: ${beforePotential}`);
            console.log(`覺醒點數: ${awakenPoints} = floor(${beforePotential} * ${awakenRate})`);
            
            for (let i = 0; i < awakenPoints; i++) {
                const randomStat = stats[Math.floor(Math.random() * stats.length)];
                monster[randomStat] = (monster[randomStat] || 0) + 1;
                increases[randomStat]++;
                
                if (randomStat === 'def') {
                    monster.maxhp = (monster.maxhp || 0) + 3;
                    console.log(`  覺醒分配 ${statNames[randomStat]}: +1 (體質影響 maxhp+3)`);
                } else {
                    console.log(`  覺醒分配 ${statNames[randomStat]}: +1`);
                }
            }
            console.log('覺醒後能力值增加:', increases);
        } else {
            console.log('未觸發潛力覺醒');
            const potentialMultiplier = 1.1 + Math.random() * 0.2;
            const beforePotential = monster.potential;
            monster.potential = Math.floor(monster.potential * potentialMultiplier);
            console.log(`potential 累積: ${beforePotential} -> ${monster.potential} (x${potentialMultiplier.toFixed(2)})`);
        }
    } else {
        console.log('--- 累積 potential (尚未覺醒) ---');
        const potentialMultiplier = 1.1 + Math.random() * 0.2;
        const beforePotential = monster.potential;
        monster.potential = Math.floor(monster.potential * potentialMultiplier);
        console.log(`potential 累積: ${beforePotential} -> ${monster.potential} (x${potentialMultiplier.toFixed(2)})`);
    }
    
    console.log('=== 計算結束 ===');
    console.log('最終能力值增加:', increases);
    console.log('最終 potential:', monster.potential);
    
    return { awakened, increases };
}

function processAwakeningStats(monster) {
    if (!monster.potential) monster.potential = 0;
    
    console.log('=== 潛力覺醒計算 ===');
    console.log('原有 potential:', monster.potential);
    
    const increases = {
        str: 0,
        int: 0,
        def: 0,
        dex: 0,
        cha: 0
    };
    
    const stats = ['str', 'int', 'def', 'dex', 'cha'];
    const statNames = { str: '力', int: '智', def: '體', dex: '速', cha: '美' };
    
    const awakenRate = 0.25 + Math.random() * 0.15;
    console.log('覺醒倍率:', awakenRate, '(範圍 0.25~0.4)');
    
    const beforePotential = monster.potential;
    const awakenPoints = Math.floor(monster.potential * awakenRate);
    monster.potential -= awakenPoints;
    console.log(`覺醒點數: ${awakenPoints} = floor(${beforePotential} * ${awakenRate})`);
    
    for (let i = 0; i < awakenPoints; i++) {
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        monster[randomStat] = (monster[randomStat] || 0) + 1;
        increases[randomStat]++;
        
        if (randomStat === 'def') {
            monster.maxhp = (monster.maxhp || 0) + 3;
            console.log(`  覺醒分配 ${statNames[randomStat]}: +1 (體質影響 maxhp+3)`);
        } else {
            console.log(`  覺醒分配 ${statNames[randomStat]}: +1`);
        }
    }
    
    console.log('覺醒能力值增加:', increases);
    console.log('最終 potential:', monster.potential);
    
    return { increases };
}

function showAwakeningPopup(monster, oldStats, callback) {
    const statsBeforeAwakening = {
        str: monster.str || 0,
        int: monster.int || 0,
        def: monster.def || 0,
        dex: monster.dex || 0,
        cha: monster.cha || 0,
        maxhp: monster.maxhp || 0
    };
    
    const awakenResult = processAwakeningStats(monster);
    
    const newStats = {
        name: monster.name,
        str: monster.str || 0,
        int: monster.int || 0,
        def: monster.def || 0,
        dex: monster.dex || 0,
        cha: monster.cha || 0,
        maxhp: monster.maxhp || 0
    };
    
    const existingOverlay = document.getElementById('awakening-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'awakening-overlay';
    
    const container = document.createElement('div');
    container.className = 'levelup-container';
    
    const hpIncrease = newStats.maxhp - statsBeforeAwakening.maxhp;
    const hpHtml = hpIncrease > 0 ? `<div class="levelup-hp-increase" style="color:#69db7c;margin-top:10px;">最大HP +${hpIncrease}！</div>` : '';
    
    let html = `
        <div class="levelup-title awaken">潛力覺醒！</div>
        <div class="levelup-pet-name">${monster.name || '寵物'}潛藏的力量展現了出來</div>
        <div class="levelup-stats-row">
            <div class="levelup-stat-col">
                <div class="levelup-stat-label str">力</div>
                <div class="levelup-stat-old">${statsBeforeAwakening.str}</div>
                <div class="levelup-stat-inc">+${awakenResult.increases.str}</div>
                <div class="levelup-stat-new">${newStats.str}</div>
            </div>
            <div class="levelup-stat-col">
                <div class="levelup-stat-label int">智</div>
                <div class="levelup-stat-old">${statsBeforeAwakening.int}</div>
                <div class="levelup-stat-inc">+${awakenResult.increases.int}</div>
                <div class="levelup-stat-new">${newStats.int}</div>
            </div>
            <div class="levelup-stat-col">
                <div class="levelup-stat-label def">體</div>
                <div class="levelup-stat-old">${statsBeforeAwakening.def}</div>
                <div class="levelup-stat-inc">+${awakenResult.increases.def}</div>
                <div class="levelup-stat-new">${newStats.def}</div>
            </div>
            <div class="levelup-stat-col">
                <div class="levelup-stat-label dex">速</div>
                <div class="levelup-stat-old">${statsBeforeAwakening.dex}</div>
                <div class="levelup-stat-inc">+${awakenResult.increases.dex}</div>
                <div class="levelup-stat-new">${newStats.dex}</div>
            </div>
            <div class="levelup-stat-col">
                <div class="levelup-stat-label cha">美</div>
                <div class="levelup-stat-old">${statsBeforeAwakening.cha}</div>
                <div class="levelup-stat-inc">+${awakenResult.increases.cha}</div>
                <div class="levelup-stat-new">${newStats.cha}</div>
            </div>
            ${hpHtml}
        </div>
    `;
    
    container.innerHTML = html;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '確定';
    closeBtn.className = 'levelup-close-btn';
    closeBtn.onclick = () => {
        overlay.remove();
        if (callback) callback();
    };
    
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    return overlay;
}

function showLevelUpPopup(levelUpData, callback) {
    const existingOverlay = document.getElementById('levelup-overlay');
    if (existingOverlay) existingOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'levelup-overlay';
    
    const container = document.createElement('div');
    container.className = 'levelup-container';
    
    const hpIncrease = levelUpData.newStats.maxhp - levelUpData.oldStats.maxhp;
    const hpHtml = hpIncrease > 0 ? `<div class="levelup-hp-increase" style="color:#69db7c;margin-top:10px;">最大HP +${hpIncrease}！</div>` : '';
    
    let html = `
        <div class="levelup-title">升級！</div>
        <div class="levelup-lv-change">Lv.${levelUpData.oldLv} → Lv.${levelUpData.newLv}</div>
        <div class="levelup-stats-row">
            <div class="levelup-stat-col">
                <div class="levelup-stat-label str">力</div>
                <div class="levelup-stat-old">${levelUpData.oldStats.str}</div>
                <div class="levelup-stat-inc">+${levelUpData.increases.str}</div>
                <div class="levelup-stat-new">${levelUpData.newStats.str}</div>
            </div>
            <div class="levelup-stat-col">
                <div class="levelup-stat-label int">智</div>
                <div class="levelup-stat-old">${levelUpData.oldStats.int}</div>
                <div class="levelup-stat-inc">+${levelUpData.increases.int}</div>
                <div class="levelup-stat-new">${levelUpData.newStats.int}</div>
            </div>
            <div class="levelup-stat-col">
                <div class="levelup-stat-label def">體</div>
                <div class="levelup-stat-old">${levelUpData.oldStats.def}</div>
                <div class="levelup-stat-inc">+${levelUpData.increases.def}</div>
                <div class="levelup-stat-new">${levelUpData.newStats.def}</div>
            </div>
            <div class="levelup-stat-col">
                <div class="levelup-stat-label dex">速</div>
                <div class="levelup-stat-old">${levelUpData.oldStats.dex}</div>
                <div class="levelup-stat-inc">+${levelUpData.increases.dex}</div>
                <div class="levelup-stat-new">${levelUpData.newStats.dex}</div>
            </div>
            <div class="levelup-stat-col">
                <div class="levelup-stat-label cha">美</div>
                <div class="levelup-stat-old">${levelUpData.oldStats.cha}</div>
                <div class="levelup-stat-inc">+${levelUpData.increases.cha}</div>
                <div class="levelup-stat-new">${levelUpData.newStats.cha}</div>
            </div>
        </div>
        ${hpHtml}
    `;
    
    container.innerHTML = html;
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '確定';
    closeBtn.className = 'levelup-close-btn';
    closeBtn.onclick = () => {
        overlay.remove();
        
        const data = getSaveData();
        if (data && data.monster) {
            const oldStats = {
                str: data.monster.str,
                int: data.monster.int,
                def: data.monster.def,
                dex: data.monster.dex,
                cha: data.monster.cha
            };
            
            const randomCheck = Math.random() * 100;
            if (randomCheck < 200) { //測試：200
                saveGame(data);
                showAwakeningPopup(data.monster, oldStats, () => {
                    if (callback) callback();
                });
                return;
            }
        }
        
        if (callback) callback();
    };
    
    container.appendChild(closeBtn);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    return overlay;
}

const AFFECTION_MAX = 1000;

function checkAffectionLevelUp(monster) {
    if (!monster.affection_exp) monster.affection_exp = 0;
    if (!monster.affection_lv) monster.affection_lv = 1;
    
    if (monster.affection_exp >= AFFECTION_MAX) {
        monster.affection_lv += 1;
        monster.affection_exp = monster.affection_exp - AFFECTION_MAX;
        return true;
    }
    return false;
}

function addAffection(monster, amount) {
    if (!monster.affection_exp) monster.affection_exp = 0;
    if (!monster.affection_lv) monster.affection_lv = 1;
    
    monster.affection_exp += amount;
    return checkAffectionLevelUp(monster);
}

function decreaseStmAndClean(monster) {
    if (!monster.stm) monster.stm = 100;
    if (!monster.clean) monster.clean = 100;
    if (!monster.unchiTimer) monster.unchiTimer = 0;
    if (!monster.unchi) monster.unchi = 0;
    if (!monster.affection_exp) monster.affection_exp = 0;
    if (!monster.affection_lv) monster.affection_lv = 1;
    
    let stmDecrease = 0;
    let cleanDecrease = 0;
    
    if (Math.random() < 0.5) {
        stmDecrease = Math.floor(Math.random() * 2) + 1;
        const newStm = monster.stm - stmDecrease;
        if (newStm < 0) {
            const hpDamage = Math.abs(newStm) * 3;
            monster.stm = 0;
            monster.hp = Math.max(0, (monster.hp || 0) - hpDamage);
        } else {
            monster.stm = newStm;
        }
    }
    
    if (Math.random() < 0.5) {
        cleanDecrease = Math.floor(Math.random() * 2) + 1;
        if (monster.unchi > 0) {
            cleanDecrease += monster.unchi * 2;
        }
        const newClean = monster.clean - cleanDecrease;
        if (newClean < 0) {
            monster.clean = 0;
            if (monster.affection_lv > 1) {
                if (monster.affection_exp > 0) {
                    monster.affection_exp -= 1;
                } else {
                    monster.affection_lv -= 1;
                    monster.affection_exp = 999;
                }
            } else {
                monster.affection_exp = 0;
            }
        } else {
            monster.clean = newClean;
        }
    }
    
    if (stmDecrease > 0) {
        monster.unchiTimer += stmDecrease;
        while (monster.unchiTimer >= 100) {
            monster.unchiTimer -= 100;
            monster.unchi += 1;
        }
    }
}
 
function displayUnchi(monster, forceRedraw = false) {
    const monsterImage = document.querySelector('.monster-image');
    if (!monsterImage) return;
    
    const existingUnchi = monsterImage.querySelectorAll('.unchi-item');
    const existingCount = existingUnchi.length;
    const targetCount = monster.unchi || 0;
    
    if (targetCount <= 0) {
        existingUnchi.forEach(el => el.remove());
        return;
    }
    
    if (forceRedraw) {
        existingUnchi.forEach(el => el.remove());
        for (let i = 0; i < targetCount; i++) {
            addUnchiElement(monsterImage);
        }
        return;
    }
    
    if (existingCount < targetCount) {
        const toAdd = targetCount - existingCount;
        for (let i = 0; i < toAdd; i++) {
            addUnchiElement(monsterImage);
        }
    } else if (existingCount > targetCount) {
        const toRemove = existingCount - targetCount;
        for (let i = 0; i < toRemove; i++) {
            existingUnchi[i].remove();
        }
    }
}

function addUnchiElement(monsterImage) {
    const unchiEl = document.createElement('div');
    unchiEl.className = 'unchi-item';
    
    const randomLeft = 10 + Math.random() * 80;
    const __BASE_PATH = typeof BASE_PATH !== 'undefined' ? BASE_PATH : '';
    
    unchiEl.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: ${randomLeft}%;
        transform: translateX(-50%);
        width: 64px;
        height: 64px;
        background-image: url('${__BASE_PATH}datas/images/ui/unchi.png');
        background-size: contain;
        background-repeat: no-repeat;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        z-index: 10;
    `;
    
    monsterImage.appendChild(unchiEl);
}
