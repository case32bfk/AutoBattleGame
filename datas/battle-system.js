const BattleSystem = (function() {
    let battleState = null;
    let autoMode = false;
    let battleCallback = null;

    function init(callback) {
        battleCallback = callback;
    }

    function addBattleLog(message) {
        const log = document.getElementById('battle-log');
        if (!log) return;
        const p = document.createElement('p');
        p.textContent = message;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
    }

    function getAllSkillsForMonster(monster) {
        const skills = [];
        if (!monster.skill_id) return skills;
        
        const skillIds = Array.isArray(monster.skill_id) ? monster.skill_id : [monster.skill_id];
        
        for (const skillId of skillIds) {
            const skill = SkillDataManager.getSkillById(skillId);
            if (skill) {
                skills.push(skill);
            }
        }
        return skills;
    }

    function evaluateUseFormula(formula, self, target) {
        try {
            const useSelf = {
                hp: self.hp,
                mhp: self.maxhp,
                str: self.str,
                def: self.def,
                dex: self.dex,
                int: self.int,
                cha: self.cha,
                lv: self.lv || 1
            };
            const useTarget = target ? {
                hp: target.hp,
                mhp: target.maxhp,
                str: target.str,
                def: target.def,
                dex: target.dex,
                int: target.int,
                cha: target.cha,
                lv: target.lv || 1
            } : {};
            
            let useValue = 3;
            if (formula) {
                const conditionMatch = formula.match(/^(.+)\?(\d+):(\d+)$/);
                if (conditionMatch) {
                    const condition = conditionMatch[1]
                        .replace(/self\.hp/g, useSelf.hp)
                        .replace(/self\.mhp/g, useSelf.mhp)
                        .replace(/self\.str/g, useSelf.str)
                        .replace(/self\.def/g, useSelf.def)
                        .replace(/self\.dex/g, useSelf.dex)
                        .replace(/self\.int/g, useSelf.int)
                        .replace(/self\.cha/g, useSelf.cha)
                        .replace(/self\.lv/g, useSelf.lv)
                        .replace(/target\.hp/g, useTarget.hp)
                        .replace(/target\.mhp/g, useTarget.mhp)
                        .replace(/target\.str/g, useTarget.str)
                        .replace(/target\.def/g, useTarget.def)
                        .replace(/target\.dex/g, useTarget.dex)
                        .replace(/target\.int/g, useTarget.int)
                        .replace(/target\.cha/g, useTarget.cha)
                        .replace(/target\.lv/g, useTarget.lv);
                    const trueVal = parseInt(conditionMatch[2]);
                    const falseVal = parseInt(conditionMatch[3]);
                    useValue = eval(condition) ? trueVal : falseVal;
                } else {
                    useValue = parseInt(formula) || 3;
                }
            }
            return Math.max(1, useValue);
        } catch (e) {
            console.error('use公式運算錯誤:', e);
            return 3;
        }
    }

    function buildActionList(skills, self, target) {
        const actionList = [];
        
        for (const skill of skills) {
            const useValue = evaluateUseFormula(skill.use, self, target);
            actionList.push({
                skill: skill,
                use: useValue
            });
        }
        
        actionList.sort((a, b) => b.use - a.use);
        
        return actionList;
    }

    function selectActionByWeight(actionList) {
        const totalUse = actionList.reduce((sum, action) => sum + action.use, 0);
        if (totalUse === 0) return actionList[0]?.skill || null;
        
        const randomValue = Math.floor(Math.random() * totalUse) + 1;
        let cumulative = 0;
        
        for (const action of actionList) {
            cumulative += action.use;
            if (randomValue <= cumulative) {
                return action.skill;
            }
        }
        
        return actionList[actionList.length - 1].skill;
    }

    function parseSkillFormula(formulaStr) {
        const parts = formulaStr.split('/');
        const result = {
            target: 'target',
            formula: '',
            extra: []
        };
        
        if (parts.length >= 1) {
            result.target = parts[0].trim();
        }
        if (parts.length >= 2) {
            result.formula = parts[1].trim();
        }
        if (parts.length >= 3) {
            const extraStr = parts[2].trim();
            const extraParts = extraStr.split(',');
            for (const extra of extraParts) {
                const criMatch = extra.match(/^cri\s*([+-]?\d+)$/i);
                if (criMatch) {
                    result.extra.push({ type: 'cri', value: parseInt(criMatch[1]) });
                    continue;
                }
                const againstMatch = extra.match(/^against:\s*["']?(\w+)["']?$/i);
                if (againstMatch) {
                    result.extra.push({ type: 'against', value: againstMatch[1] });
                    continue;
                }
                const defBreakMatch = extra.match(/^defBreak\s*([+-]?\d+)$/i);
                if (defBreakMatch) {
                    result.extra.push({ type: 'defBreak', value: parseInt(defBreakMatch[1]) });
                    continue;
                }
            }
        }
        
        return result;
    }

    function evaluateDamageFormula(formula, attacker, defender, isHeal) {
        try {
            const ctx = {
                self: {
                    hp: attacker.hp,
                    mhp: attacker.maxhp,
                    str: attacker.str,
                    def: attacker.def,
                    dex: attacker.dex,
                    int: attacker.int,
                    cha: attacker.cha,
                    lv: attacker.lv || 1
                },
                target: {
                    hp: defender.hp,
                    mhp: defender.maxhp,
                    str: defender.str,
                    def: defender.def,
                    dex: defender.dex,
                    int: defender.int,
                    cha: defender.cha,
                    lv: defender.lv || 1
                }
            };
            
            let expr = formula
                .replace(/self\.hp/g, `(${ctx.self.hp})`)
                .replace(/self\.mhp/g, `(${ctx.self.mhp})`)
                .replace(/self\.str/g, `(${ctx.self.str})`)
                .replace(/self\.def/g, `(${ctx.self.def})`)
                .replace(/self\.dex/g, `(${ctx.self.dex})`)
                .replace(/self\.int/g, `(${ctx.self.int})`)
                .replace(/self\.cha/g, `(${ctx.self.cha})`)
                .replace(/self\.lv/g, `(${ctx.self.lv})`)
                .replace(/target\.hp/g, `(${ctx.target.hp})`)
                .replace(/target\.mhp/g, `(${ctx.target.mhp})`)
                .replace(/target\.str/g, `(${ctx.target.str})`)
                .replace(/target\.def/g, `(${ctx.target.def})`)
                .replace(/target\.dex/g, `(${ctx.target.dex})`)
                .replace(/target\.int/g, `(${ctx.target.int})`)
                .replace(/target\.cha/g, `(${ctx.target.cha})`)
                .replace(/target\.lv/g, `(${ctx.target.lv})`);
            
            let value = eval(expr);
            return Math.max(0, Math.floor(value));
        } catch (e) {
            console.error('傷害公式運算錯誤:', e);
            return 0;
        }
    }

    function applyElementEffect(damage, skillElement, targetElement, targetStrong) {
        if (!targetElement) return damage;
        
        const targetElementId = typeof targetElement === 'number' ? targetElement : 
            (targetElement.element_id !== undefined ? targetElement.element_id : parseInt(targetElement));
        const skillElementId = typeof skillElement === 'number' ? skillElement : 
            (skillElement.element_id !== undefined ? skillElement.element_id : parseInt(skillElement));
        
        if (targetStrong && targetStrong.includes(skillElementId)) {
            const randomFactor = 0.25 + Math.random() * 0.25;
            return Math.floor(damage * randomFactor);
        }
        
        return damage;
    }

    function executeSkill(skill, attacker, defender, isPlayer) {
        const isHeal = attacker === defender;
        const parsed = parseSkillFormula(skill.formula);
        
        let baseDamage = 0;
        if (parsed.formula) {
            baseDamage = evaluateDamageFormula(parsed.formula, attacker, defender, isHeal);
        }
        
        let finalDamage = baseDamage;
        let critMultiplier = 1;
        let isCrit = false;
        let defBreak = false;
        let againstBonus = 1;
        
        const attackerEntity = isPlayer ? battleState.player : battleState.enemy;
        const defenderEntity = isPlayer ? battleState.enemy : battleState.player;
        
        if (!isHeal) {
            for (const extra of parsed.extra) {
                if (extra.type === 'cri') {
                    const critRate = (attackerEntity.crit_rate || 0) + extra.value;
                    if (Math.random() * 100 < critRate) {
                        isCrit = true;
                        critMultiplier = 3;
                    }
                }
                if (extra.type === 'defBreak') {
                    defBreak = true;
                }
                if (extra.type === 'against') {
                    const targetRace = defenderEntity.race || '';
                    if (targetRace.toLowerCase() === extra.value.toLowerCase()) {
                        againstBonus = 1.5;
                    }
                }
            }
            
            const isDefending = isPlayer ? battleState.isDefending.enemy : battleState.isDefending.player;
            let defense = defenderEntity.def || 0;
            if (isDefending && !defBreak) {
                defense = Math.floor(defense * 1.5);
            }
            
            finalDamage = Math.max(1, finalDamage - Math.floor(defense / 2));
            finalDamage = Math.floor(finalDamage * critMultiplier * againstBonus);
            
            if (skill.element !== undefined && skill.element !== null) {
                const targetStrong = defenderEntity.strong || [];
                finalDamage = applyElementEffect(finalDamage, skill.element, defenderEntity.element, targetStrong);
            }
        } else {
            finalDamage = baseDamage;
        }
        
        if (isHeal) {
            const healAmount = Math.min(finalDamage, (defender.maxhp || defender.maxHp) - defender.hp);
            defender.hp += healAmount;
            addBattleLog(`${attacker.name}施展了${skill.name}`);
            addBattleLog(`對${defender.name}造成${healAmount}治療`);
        } else {
            defender.hp = Math.max(0, defender.hp - finalDamage);
            addBattleLog(`${attacker.name}施展了${skill.name}`);
            if (isCrit) {
                addBattleLog(`擊中要害！`);
            }
            addBattleLog(`對${defender.name}造成${finalDamage}傷害`);
        }
        
        return finalDamage;
    }

    function calculateExpReward(playerLv, enemyLv) {
        const randomFactor = 1 + Math.random() * 0.5;
        const truncatedFactor = Math.floor(randomFactor * 100) / 100;
        let exp = enemyLv * truncatedFactor * enemyLv / playerLv;
        exp = Math.floor(exp);
        return Math.max(1, exp);
    }

    function showBattleResult(isWin, exp, gold, levelUpResult) {
        const battleLog = document.getElementById('battle-log');
        if (!battleLog) return;
        
        battleLog.innerHTML = '';
        
        const resultContainer = document.createElement('div');
        resultContainer.className = 'battle-result';
        resultContainer.style.cssText = 'text-align:center;padding:20px;';
        
        if (isWin) {
            resultContainer.innerHTML = `
                <h2 style="color:#4ade80;margin-bottom:15px;">戰鬥勝利！</h2>
                <div class="result-rewards" style="font-size:18px;">
                    <p>獲得經驗值: <span style="color:#fbbf24;">${exp}</span></p>
                    <p>獲得金幣: <span style="color:#fbbf24;">${gold}</span></p>
                </div>
            `;
        } else {
            resultContainer.innerHTML = `
                <h2 style="color:#f87171;margin-bottom:15px;">戰鬥失敗...</h2>
                <p>請回到培養頁重新出發！</p>
            `;
        }
        
        battleLog.appendChild(resultContainer);
        
        if (isWin) {
            const continueBtn = document.createElement('button');
            continueBtn.textContent = '返回培養';
            continueBtn.style.cssText = 'margin-top:20px;padding:10px 30px;font-size:16px;background:#4ade80;color:#000;border:none;border-radius:5px;cursor:pointer;';
            continueBtn.onclick = () => {
                if (levelUpResult && levelUpResult.leveledUp) {
                    showLevelUpPopup(levelUpResult, () => {
                        window.location.href = 'Training.html';
                    });
                } else {
                    window.location.href = 'Training.html';
                }
            };
            resultContainer.appendChild(continueBtn);
            
            if (levelUpResult && levelUpResult.leveledUp) {
                const levelUpBtn = document.createElement('button');
                levelUpBtn.textContent = '查看升級';
                levelUpBtn.style.cssText = 'margin-top:10px;margin-left:10px;padding:10px 30px;font-size:16px;background:#ffd700;color:#000;border:none;border-radius:5px;cursor:pointer;';
                levelUpBtn.onclick = () => {
                    showLevelUpPopup(levelUpResult, () => {
                        window.location.href = 'Training.html';
                    });
                };
                resultContainer.appendChild(levelUpBtn);
            }
        } else {
            setTimeout(() => {
                window.location.href = 'Training.html';
            }, 1500);
        }
    }

    function updateBattleState() {
        if (!battleState) return;
        document.getElementById('player-hp').textContent = battleState.player.hp;
        document.getElementById('player-max-hp').textContent = battleState.player.maxhp;
        document.getElementById('enemy-hp').textContent = battleState.enemy.hp;
        document.getElementById('enemy-max-hp').textContent = battleState.enemy.maxhp;
    }

    function startBattle(playerMonster, enemyMonster) {
        const playerSkills = getAllSkillsForMonster(playerMonster);
        const enemySkills = getAllSkillsForMonster(enemyMonster);
        
        battleState = {
            player: {
                name: playerMonster.name || '未知',
                hp: playerMonster.hp || 0,
                maxhp: playerMonster.maxhp || playerMonster.maxHp || 100,
                str: playerMonster.str || playerMonster.atk || 0,
                def: playerMonster.def || 0,
                dex: playerMonster.dex || playerMonster.speed || 0,
                int: playerMonster.int || 0,
                cha: playerMonster.cha || 0,
                lv: playerMonster.lv || 1,
                element: playerMonster.element,
                strong: playerMonster.strong || [],
                crit_rate: playerMonster.crit_rate || 0,
                race: playerMonster.race || null,
                skill_id: playerMonster.skill_id
            },
            enemy: {
                name: enemyMonster.name || '未知',
                hp: enemyMonster.hp || 0,
                maxhp: enemyMonster.maxhp || enemyMonster.maxHp || 100,
                str: enemyMonster.str || enemyMonster.atk || 0,
                def: enemyMonster.def || 0,
                dex: enemyMonster.dex || enemyMonster.speed || 0,
                int: enemyMonster.int || 0,
                cha: enemyMonster.cha || 0,
                lv: enemyMonster.lv || 1,
                element: enemyMonster.element,
                strong: enemyMonster.strong || [],
                crit_rate: enemyMonster.crit_rate || 0,
                race: enemyMonster.race || null,
                skill_id: enemyMonster.skill_id
            },
            actionValue: { player: 0, enemy: 0 },
            maxAction: 0,
            isBattleOver: false,
            isDefending: { player: false, enemy: false },
            playerActionList: buildActionList(playerSkills, battleState.player, battleState.enemy),
            enemyActionList: buildActionList(enemySkills, battleState.enemy, battleState.player)
        };

        const playerSpeed = battleState.player.dex;
        const enemySpeed = battleState.enemy.dex;
        battleState.maxAction = Math.max(playerSpeed, enemySpeed);
        battleState.actionValue = { player: playerSpeed, enemy: enemySpeed };

        const firstMover = playerSpeed >= enemySpeed ? battleState.player.name : battleState.enemy.name;
        addBattleLog(`戰鬥開始！${firstMover}速度較快，優先行動`);

        if (battleState.playerActionList.length > 0) {
            const sortedList = battleState.playerActionList.map(a => `${a.skill.name}(${a.use})`).join(' > ');
            addBattleLog(`玩家技能排序: ${sortedList}`);
        }
        if (battleState.enemyActionList.length > 0) {
            const sortedList = battleState.enemyActionList.map(a => `${a.skill.name}(${a.use})`).join(' > ');
            addBattleLog(`敵人技能排序: ${sortedList}`);
        }

        updateBattleUI();
        
        if (battleCallback) battleCallback('start');
    }

    function updateBattleUI() {
        if (!battleState) return;
        document.getElementById('player-hp').textContent = battleState.player.hp;
        document.getElementById('player-max-hp').textContent = battleState.player.maxhp;
        document.getElementById('player-str').textContent = battleState.player.str;
        document.getElementById('player-int').textContent = battleState.player.int;
        document.getElementById('player-def').textContent = battleState.player.def;
        document.getElementById('player-dex').textContent = battleState.player.dex;
        document.getElementById('player-cha').textContent = battleState.player.cha;

        document.getElementById('enemy-hp').textContent = battleState.enemy.hp;
        document.getElementById('enemy-max-hp').textContent = battleState.enemy.maxhp;
        document.getElementById('enemy-str').textContent = battleState.enemy.str;
        document.getElementById('enemy-int').textContent = battleState.enemy.int;
        document.getElementById('enemy-def').textContent = battleState.enemy.def;
        document.getElementById('enemy-dex').textContent = battleState.enemy.dex;
        document.getElementById('enemy-cha').textContent = battleState.enemy.cha;
    }

    function processTurn() {
        if (!battleState || battleState.isBattleOver) return;

        while (!battleState.isBattleOver) {
            battleState.actionValue.player += battleState.player.dex;
            battleState.actionValue.enemy += battleState.enemy.dex;

            const playerReady = battleState.actionValue.player >= battleState.maxAction;
            const enemyReady = battleState.actionValue.enemy >= battleState.maxAction;

            if (playerReady && enemyReady) {
                if (battleState.player.dex >= battleState.enemy.dex) {
                    battleState.actionValue.player -= battleState.maxAction;
                    battleState.actionValue.enemy -= battleState.maxAction;
                    executePlayerAction();
                    if (battleState.isBattleOver) break;
                    executeEnemyAction();
                } else {
                    battleState.actionValue.player -= battleState.maxAction;
                    battleState.actionValue.enemy -= battleState.maxAction;
                    executeEnemyAction();
                    if (battleState.isBattleOver) break;
                    executePlayerAction();
                }
            } else if (playerReady) {
                battleState.actionValue.player -= battleState.maxAction;
                executePlayerAction();
            } else if (enemyReady) {
                battleState.actionValue.enemy -= battleState.maxAction;
                executeEnemyAction();
            } else {
                break;
            }

            if (!battleState.isBattleOver) {
                addBattleLog('---');
            }
        }
    }

    function executePlayerAction() {
        if (!battleState) return;
        battleState.isDefending.player = false;
        
        const selectedSkill = selectActionByWeight(battleState.playerActionList);
        
        if (selectedSkill) {
            executeSkill(selectedSkill, battleState.player, battleState.enemy, true);
        } else {
            const damage = calculateDamage(battleState.player, battleState.enemy);
            battleState.enemy.hp = Math.max(0, battleState.enemy.hp - damage);
            addBattleLog(`${battleState.player.name}施展了基礎攻擊`);
            addBattleLog(`對${battleState.enemy.name}造成${damage}傷害`);
        }
        
        updateBattleState();
        checkBattleEnd();
    }

    function executeEnemyAction() {
        if (!battleState) return;
        battleState.isDefending.enemy = false;
        
        const selectedSkill = selectActionByWeight(battleState.enemyActionList);
        
        if (selectedSkill) {
            executeSkill(selectedSkill, battleState.enemy, battleState.player, false);
        } else {
            const damage = calculateDamage(battleState.enemy, battleState.player);
            battleState.player.hp = Math.max(0, battleState.player.hp - damage);
            addBattleLog(`${battleState.enemy.name}施展了基礎攻擊`);
            addBattleLog(`對${battleState.player.name}造成${damage}傷害`);
        }
        
        updateBattleState();
        checkBattleEnd();
    }

    function calculateDamage(attacker, defender) {
        if (!battleState) return 1;
        const baseDamage = attacker.atk;
        const isDefending = defender === battleState.player ? battleState.isDefending.player : battleState.isDefending.enemy;
        const defense = isDefending ? Math.floor(defender.def * 1.5) : defender.def;
        const damage = Math.max(1, baseDamage - Math.floor(defense / 2));
        return damage;
    }

    function checkBattleEnd() {
        if (!battleState || battleState.isBattleOver) return;

        if (battleState.player.hp <= 0) {
            battleState.isBattleOver = true;
            addBattleLog(`${battleState.player.name}被打敗了！`);
            disableBattleButtons();
            if (battleCallback) battleCallback('lose');
            showBattleResult(false, 0, 0);
        } else if (battleState.enemy.hp <= 0) {
            battleState.isBattleOver = true;
            addBattleLog(`${battleState.enemy.name}被擊敗了！戰鬥勝利！`);
            disableBattleButtons();
            
            const playerLv = battleState.player.lv || 1;
            const enemyLv = battleState.enemy.lv || 1;
            const expReward = calculateExpReward(playerLv, enemyLv);
            const goldReward = Math.floor(battleState.enemy.maxhp / 2);
            
            const data = getSaveData();
            if (data && data.monster) {
                data.gold = (data.gold || 0) + goldReward;
                data.monster.exp = (data.monster.exp || 0) + expReward;
                
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
                    
                    if (battleCallback) battleCallback('win', { gold: goldReward, exp: expReward, levelUp: levelUpResult });
                    showBattleResult(true, expReward, goldReward, levelUpResult);
                    return;
                }
                
                saveGame(data);
            }

            if (battleCallback) battleCallback('win', { gold: goldReward, exp: expReward });
            showBattleResult(true, expReward, goldReward);
        }
    }

    function onPlayerAttack() {
        if (!battleState || battleState.isBattleOver) return;
        disableBattleButtons();
        processTurn();
        if (!battleState.isBattleOver) {
            setTimeout(() => {
                enableBattleButtons();
                if (autoMode) {
                    setTimeout(() => onPlayerAttack(), 500);
                }
            }, 300);
        }
    }

    function onPlayerDefend() {
        if (!battleState || battleState.isBattleOver) return;
        disableBattleButtons();
        battleState.isDefending.player = true;
        addBattleLog(`${battleState.player.name}進行防禦！`);
        processTurn();
        if (!battleState.isBattleOver) {
            setTimeout(() => {
                enableBattleButtons();
                if (autoMode) {
                    setTimeout(() => onPlayerAttack(), 500);
                }
            }, 300);
        }
    }

    function onPlayerCapture() {
        addBattleLog(`捕捉功能尚未開放`);
    }

    function onPlayerAdvance() {
        if (!battleState || battleState.isBattleOver) return;
        addBattleLog(`前進功能尚未開放`);
    }

    function setAutoMode(enabled) {
        autoMode = enabled;
        if (battleCallback) battleCallback('auto', enabled);
    }

    function isAutoMode() {
        return autoMode;
    }

    function isBattleOver() {
        return battleState ? battleState.isBattleOver : true;
    }

    function disableBattleButtons() {
        const btnAttack = document.getElementById('btn-attack');
        const btnDefend = document.getElementById('btn-defend');
        const btnCapture = document.getElementById('btn-capture');
        if (btnAttack) btnAttack.disabled = true;
        if (btnDefend) btnDefend.disabled = true;
        if (btnCapture) btnCapture.disabled = true;
    }

    function enableBattleButtons() {
        const btnAttack = document.getElementById('btn-attack');
        const btnDefend = document.getElementById('btn-defend');
        const btnCapture = document.getElementById('btn-capture');
        if (btnAttack) btnAttack.disabled = false;
        if (btnDefend) btnDefend.disabled = false;
        if (btnCapture) btnCapture.disabled = false;
    }

    return {
        init,
        startBattle,
        onPlayerAttack,
        onPlayerDefend,
        onPlayerCapture,
        onPlayerAdvance,
        setAutoMode,
        isAutoMode,
        isBattleOver,
        updateBattleUI
    };
})();

const MapDataManager = (function() {
    let maps = [];
    let currentMap = null;

    const __BASE_PATH = typeof BASE_PATH !== 'undefined' ? BASE_PATH : '';
    
    async function loadMaps() {
        try {
            const response = await fetch(`${__BASE_PATH}datas/map/index.json`);
            maps = await response.json();
            return maps;
        } catch (error) {
            console.error('Failed to load maps:', error);
            return [];
        }
    }

    function getMapById(mapId) {
        return maps.find(m => m.map_id === mapId) || null;
    }

    function getRandomMap() {
        if (maps.length === 0) return null;
        return maps[Math.floor(Math.random() * maps.length)];
    }

    function getRandomMonster(map) {
        if (!map || !map.monster || map.monster.length === 0) {
            return {
                id: 'slime_001',
                name: '史萊姆',
                image_emoji: '💧',
                image_name: 'slime',
                lv: 1,
                hp: 80,
                maxhp: 80,
                str: 10,
                def: 8,
                dex: 15,
                int: 5,
                cha: 5
            };
        }
        
        const monsterName = map.monster[Math.floor(Math.random() * map.monster.length)];
        const levelRange = map.level || [1, 5];
        const level = Math.floor(Math.random() * (levelRange[1] - levelRange[0] + 1)) + levelRange[0];
        
        const monsterData = MonsterDataManager.getMonsterById(monsterName);
        if (monsterData) {
            const stats = MonsterDataManager.calculateStats(monsterData.id, level);
            return {
                id: monsterData.id,
                name: monsterData.name,
                image_name: monsterData.image_name,
                image_emoji: monsterData.image_emoji || '💧',
                lv: level,
                hp: stats.hp,
                maxhp: stats.hp,
                str: stats.str,
                def: stats.def,
                dex: stats.dex,
                int: stats.int,
                cha: stats.cha
            };
        }
        
        return {
            id: monsterName,
            name: monsterName,
            image_emoji: '💧',
            image_name: monsterName,
            lv: level,
            hp: 50 + level * 10,
            maxhp: 50 + level * 10,
            str: 10 + level * 2,
            def: 5 + level,
            dex: 8 + level,
            int: 5 + level,
            cha: 5 + level
        };
    }

    function getRandomItem(map) {
        if (!map || !map.item || map.item.length === 0) return null;
        
        const itemData = map.item[Math.floor(Math.random() * map.item.length)];
        const [type, name] = itemData;
        
        if (type === 'food') {
            const food = FoodDataManager.getFoodById(name);
            if (food) return food;
        }
        
        return { type, name, id: name };
    }

    function setCurrentMap(map) {
        currentMap = map;
    }

    function getCurrentMap() {
        return currentMap;
    }

    return {
        loadMaps,
        getMapById,
        getRandomMap,
        getRandomMonster,
        getRandomItem,
        setCurrentMap,
        getCurrentMap
    };
})();
