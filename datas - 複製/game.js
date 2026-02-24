const SaveData = {
    gold: 0,
    monster: null,
    gameProgress: {
        totalBattles: 0,
        wins: 0,
        losses: 0
    }
};

const SAVE_KEY = 'autoBattleGame_saveData';

function getSaveData() {
    const data = localStorage.getItem(SAVE_KEY);
    return data ? JSON.parse(data) : null;
}

function saveGame(data) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function loadSaveData() {
    const data = localStorage.getItem(SAVE_KEY);
    if (data) {
        return JSON.parse(data);
    }
    return null;
}

function checkSaveExists() {
    return localStorage.getItem(SAVE_KEY) !== null;
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
                expToNextLevel: 100,
                hp: slimeMonster.base_stats.hp,
                maxhp: slimeMonster.base_stats.hp,
                atk: slimeMonster.base_stats.atk,
                def: slimeMonster.base_stats.def,
                speed: slimeMonster.base_stats.speed,
                skill_id: Array.isArray(slimeMonster.skill_id) ? slimeMonster.skill_id : [slimeMonster.skill_id]
            };
        }
    }
    
    return {
        id: "slime_001",
        name: "小火龍",
        element: [0, null],
        lv: 1,
        exp: 0,
        expToNextLevel: 100,
        hp: 100,
        maxhp: 100,
        atk: 15,
        def: 10,
        speed: 12,
        skill_id: ["fire_1"]
    };
}

function initSaveData() {
    const monster = createDefaultMonster();
    const newData = {
        gold: 100,
        monster: monster,
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

function checkLevelUp(monster) {
    if (monster.exp >= monster.expToNextLevel) {
        monster.lv += 1;
        monster.exp = monster.exp - monster.expToNextLevel;
        monster.expToNextLevel = Math.floor(monster.expToNextLevel * 1.5);
        monster.maxhp += 10;
        monster.hp = monster.maxhp;
        monster.atk += 3;
        monster.def += 2;
        monster.speed += 1;
        
        return true;
    }
    return false;
}
