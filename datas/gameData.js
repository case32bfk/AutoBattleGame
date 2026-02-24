const SkillDataManager = {
    skillSystems: {},
    
    async loadSkillSystem(filename) {
        try {
            const response = await fetch(`/datas/skillDatas/${filename}`);
            const data = await response.json();
            this.skillSystems[filename.replace('.json', '')] = data;
            return data;
        } catch (error) {
            console.error(`載入技能系統失敗: ${filename}`, error);
            return null;
        }
    },
    
    async loadAllSkillSystems() {
        try {
            const response = await fetch('/datas/skillDatas/index.json');
            const files = await response.json();
            for (const file of files) {
                await this.loadSkillSystem(file);
            }
        } catch (error) {
            console.error('載入技能列表失敗', error);
        }
    },
    
    getSkillById(skillId) {
        for (const systemName in this.skillSystems) {
            const system = this.skillSystems[systemName];
            const skill = system.skills.find(s => s.id === skillId);
            if (skill) {
                return {
                    ...skill,
                    systemName: system.name,
                    systemIcon: system.icon,
                    systemIconIndex: system.icon_index
                };
            }
        }
        return null;
    },
    
    getAllSkills() {
        const allSkills = [];
        for (const systemName in this.skillSystems) {
            const system = this.skillSystems[systemName];
            system.skills.forEach(skill => {
                allSkills.push({
                    ...skill,
                    systemName: system.name,
                    systemIcon: system.icon,
                    systemIconIndex: system.icon_index
                });
            });
        }
        return allSkills;
    },
    
    parseFormula(formula) {
        const parts = formula.split(';');
        const parsed = {
            damage: null,
            effects: []
        };
        
        for (const part of parts) {
            const [key, value] = part.split(':');
            
            if (key === 'damage') {
                parsed.damage = value;
            } else {
                parsed.effects.push({ type: key, value: value });
            }
        }
        
        return parsed;
    }
};

const ElementDataManager = {
    elements: {},
    
    async loadElementData() {
        try {
            const response = await fetch('/datas/element.json');
            const data = await response.json();
            data.forEach(element => {
                this.elements[element.element_id] = element;
            });
            return data;
        } catch (error) {
            console.error('載入屬性資料失敗', error);
            return null;
        }
    },
    
    getElementById(elementId) {
        return this.elements[elementId] || null;
    },

    getElementsByIds(elementIds) {
        return elementIds.map(id => id !== null ? this.elements[id] : null).filter(e => e !== null);
    },

    resolveElementIcon(element) {
        if (!element || !element.element_icon) return null;
        const icon = element.element_icon;
        if (icon.length <= 2) {
            return { type: 'emoji', content: icon };
        }
        return { type: 'image', content: `/datas/images/icon/${icon}` };
    }
};

const RoomDataManager = {
    rooms: {},
    
    async loadRoomData() {
        try {
            const response = await fetch('/datas/rooms/index.json');
            const data = await response.json();
            data.forEach(room => {
                this.rooms[room.roomId] = room;
            });
            return data;
        } catch (error) {
            console.error('載入房間資料失敗', error);
            return null;
        }
    },
    
    getRoomById(roomId) {
        return this.rooms[roomId] || null;
    },
    
    getAllRooms() {
        return Object.values(this.rooms);
    },
    
    getRoomName(roomId) {
        const room = this.rooms[roomId];
        return room ? room.name : '未知';
    }
};

const SpriteAnimator = {
    animations: {},
    
    play(imageElement, baseName, options = {}) {
        const {
            frame1Suffix = '_1',
            frame2Suffix = '_2',
            frame1Callback = null,
            frame2Callback = null,
            duration = 250,
            loopCount = 4,
            onComplete = null
        } = options;
        
        if (!imageElement || !baseName) {
            if (onComplete) onComplete();
            return;
        }
        
        const id = Math.random().toString(36).substr(2, 9);
        
        this.animations[id] = {
            imageElement,
            baseName,
            frame1Suffix,
            frame2Suffix,
            frame1Callback,
            frame2Callback,
            loopCount,
            currentLoop: 0,
            isOdd: true,
            intervalId: null
        };
        
        const anim = this.animations[id];
        
        const animate = () => {
            if (anim.currentLoop >= anim.loopCount) {
                clearInterval(anim.intervalId);
                imageElement.src = `/datas/images/monster/${anim.baseName}/${anim.baseName}${anim.frame1Suffix}.png`;
                delete this.animations[id];
                if (onComplete) onComplete();
                return;
            }
            
            if (anim.isOdd) {
                imageElement.src = `/datas/images/monster/${anim.baseName}/${anim.baseName}${anim.frame2Suffix}.png`;
                if (anim.frame2Callback) anim.frame2Callback();
            } else {
                imageElement.src = `/datas/images/monster/${anim.baseName}/${anim.baseName}${anim.frame1Suffix}.png`;
                if (anim.frame1Callback) anim.frame1Callback();
                anim.currentLoop++;
            }
            
            anim.isOdd = !anim.isOdd;
        };
        
        imageElement.src = `/datas/images/monster/${baseName}/${baseName}${frame2Suffix}.png`;
        if (frame2Callback) frame2Callback();
        
        anim.intervalId = setInterval(animate, duration);
    },
    
    stop(imageElement) {
        for (const id in this.animations) {
            if (this.animations[id].imageElement === imageElement) {
                clearInterval(this.animations[id].intervalId);
                delete this.animations[id];
                break;
            }
        }
    }
};

const FoodDataManager = {
    foods: {},
    
    async loadFoodData() {
        try {
            const response = await fetch('/datas/foodIndex.json');
            const data = await response.json();
            data.forEach(food => {
                this.foods[food.id] = food;
            });
            return data;
        } catch (error) {
            console.error('載入食物資料失敗', error);
            return [];
        }
    },
    
    getFoodById(foodId) {
        return this.foods[foodId] || null;
    },
    
    getRandomFood() {
        const foodIds = Object.keys(this.foods);
        if (foodIds.length === 0) return null;
        const randomId = foodIds[Math.floor(Math.random() * foodIds.length)];
        return this.foods[randomId];
    }
};

const FoodAnimator = {
    foodElement: null,
    currentFolder: null,
    
    show(imageFolder) {
        this.stop();
        this.currentFolder = imageFolder;
        
        const container = document.querySelector('.monster-image');
        if (!container) return;
        
        let foodEl = container.querySelector('.food-animation');
        if (!foodEl) {
            foodEl = document.createElement('div');
            foodEl.className = 'food-animation';
            foodEl.style.cssText = 'position:absolute;z-index:3;width:50px;height:50px;left:10%;top:50%;transform:translate(-50%,-50%);pointer-events:none;image-rendering:pixelated;image-rendering:crisp-edges;';
            container.appendChild(foodEl);
        }
        
        foodEl.innerHTML = `<img src="/datas/images/food/${imageFolder}/${imageFolder}_0.png" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated;image-rendering:crisp-edges;">`;
        this.foodElement = foodEl;
    },
    
    updateFrame(frameIndex) {
        if (!this.foodElement || !this.currentFolder) return;
        
        this.foodElement.innerHTML = `<img src="/datas/images/food/${this.currentFolder}/${this.currentFolder}_${frameIndex}.png" style="width:100%;height:100%;object-fit:contain;image-rendering:pixelated;image-rendering:crisp-edges;">`;
    },
    
    stop() {
        if (this.foodElement) {
            this.foodElement.remove();
            this.foodElement = null;
        }
        this.currentFolder = null;
    }
};

const ResultPopup = {
    currentAnimation: null,
    show(text) {
        const container = document.querySelector('.monster-image');
        if (!container) return;
        
        let popupEl = container.querySelector('.result-popup');
        
        if (popupEl) {
            if (this.currentAnimation) {
                this.currentAnimation.cancel();
            }
            popupEl.remove();
        }
        
        popupEl = document.createElement('div');
        popupEl.className = 'result-popup';
        popupEl.style.cssText = 'position:absolute;z-index:10;left:50%;transform:translateX(-50%);font-size:24px;font-weight:bold;color:#fff;text-shadow:2px 2px 4px #000;pointer-events:none;white-space:nowrap;';
        container.appendChild(popupEl);
        
        popupEl.textContent = text;
        popupEl.style.top = '20%';
        popupEl.style.opacity = '1';
        
        this.currentAnimation = popupEl.animate([
            { top: '20%', opacity: 1 },
            { top: '10%', opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out'
        });
        
        this.currentAnimation.onfinish = () => {
            popupEl.remove();
            this.currentAnimation = null;
        };
    }
};

const GoldChangeAnimator = {
    currentAnimation: null,
    countInterval: null,
    show(changeAmount) {
        const container = document.querySelector('.gold-display');
        if (!container) return;
        
        const currentGoldEl = container.querySelector('.gold-current');
        if (!currentGoldEl) return;
        
        const currentGold = parseInt(currentGoldEl.textContent) || 0;
        const targetValue = currentGold + changeAmount;
        
        let changeEl = container.querySelector('.gold-change');
        if (changeEl) {
            if (this.currentAnimation) {
                this.currentAnimation.cancel();
            }
            changeEl.remove();
        }
        
        changeEl = document.createElement('div');
        changeEl.className = 'gold-change';
        changeEl.style.cssText = 'position:absolute;right:0;top:100%;margin-top:5px;font-size:14px;font-weight:bold;color:#ff6b6b;white-space:nowrap;';
        changeEl.style.textAlign = 'right';
        changeEl.textContent = changeAmount >= 0 ? `+${changeAmount}` : changeAmount;
        container.appendChild(changeEl);
        
        this.currentAnimation = changeEl.animate([
            { opacity: 1, transform: 'translateY(0)' },
            { opacity: 0, transform: 'translateY(-20px)' }
        ], {
            duration: 1000,
            easing: 'ease-out'
        });
        
        this.currentAnimation.onfinish = () => {
            changeEl.remove();
            this.currentAnimation = null;
        };
        
        if (this.countInterval) {
            clearInterval(this.countInterval);
        }
        
        let displayValue = currentGold;
        const step = changeAmount > 0 ? -1 : 1;
        const isDecreasing = changeAmount < 0;
        
        this.countInterval = setInterval(() => {
            if (isDecreasing) {
                displayValue--;
            } else {
                displayValue++;
            }
            currentGoldEl.textContent = displayValue;
            
            if (displayValue === targetValue) {
                clearInterval(this.countInterval);
                this.countInterval = null;
            }
        }, 30);
    }
};

const FoodEffectParser = {
    parse(effectString) {
        if (!effectString) return [];
        
        const effects = [];
        const parts = effectString.split(';');
        
        for (const part of parts) {
            const match = part.match(/^(\w+)\/([+\-*/])\/(\d+)-(\d+)$/);
            if (match) {
                effects.push({
                    stat: match[1],
                    operator: match[2],
                    min: parseInt(match[3]),
                    max: parseInt(match[4])
                });
            }
        }
        
        return effects;
    },
    
    apply(effects) {
        const result = {};
        
        for (const effect of effects) {
            const value = Math.floor(Math.random() * (effect.max - effect.min + 1)) + effect.min;
            
            if (!result[effect.stat]) {
                result[effect.stat] = 0;
            }
            
            switch (effect.operator) {
                case '+':
                    result[effect.stat] += value;
                    break;
                case '-':
                    result[effect.stat] -= value;
                    break;
                case '*':
                    result[effect.stat] = Math.floor((result[effect.stat] || 0) * value);
                    break;
                case '/':
                    result[effect.stat] = Math.floor((result[effect.stat] || 0) / value);
                    break;
            }
        }
        
        return result;
    }
};

const MonsterDataManager = {
    monsters: {},
    
    async loadMonsterData(filename) {
        try {
            const response = await fetch(`/datas/monsterDatas/${filename}`);
            const data = await response.json();
            
            if (Array.isArray(data)) {
                data.forEach(monster => {
                    this.monsters[monster.id] = monster;
                });
            } else if (data.id) {
                this.monsters[data.id] = data;
            }
            
            return data;
        } catch (error) {
            console.error(`載入怪物資料失敗: ${filename}`, error);
            return null;
        }
    },
    
    async loadAllMonsterData() {
        try {
            const response = await fetch('/datas/monsterDatas/index.json');
            const files = await response.json();
            for (const file of files) {
                await this.loadMonsterData(file);
            }
        } catch (error) {
            console.error('載入怪物列表失敗', error);
        }
    },
    
    getMonsterById(monsterId) {
        return this.monsters[monsterId] || null;
    },
    
    getMonsterByName(name) {
        for (const id in this.monsters) {
            if (this.monsters[id].name === name) {
                return this.monsters[id];
            }
        }
        return null;
    },
    
    getEvolutionTree(monsterId) {
        const tree = [];
        let currentId = monsterId;
        
        while (currentId && this.monsters[currentId]) {
            const monster = this.monsters[currentId];
            tree.push({
                id: monster.id,
                name: monster.name,
                element: monster.element,
                image_name: monster.image_name,
                base_stats: monster.base_stats,
                skill_id: monster.skill_id,
                next: monster.next || []
            });
            
            if (!monster.next || monster.next.length === 0) {
                break;
            }
            
            currentId = monster.next[0];
        }
        
        return tree;
    },
    
    getAllEvolutions(monsterId) {
        const allEvos = [];
        
        if (!this.monsters[monsterId]) return allEvos;
        
        for (const id in this.monsters) {
            const monster = this.monsters[id];
            if (monster.next && monster.next.includes(monsterId)) {
                allEvos.push(monster);
            }
        }
        
        return allEvos;
    },
    
    calculateStats(monsterId, level) {
        const monster = this.monsters[monsterId];
        if (!monster || !monster.base_stats) return null;
        
        const stats = {
            hp: Math.floor(monster.base_stats.hp * (1 + (level - 1) * 0.1)),
            maxhp: Math.floor(monster.base_stats.hp * (1 + (level - 1) * 0.1)),
            str: Math.floor((monster.base_stats.str || 10) * (1 + (level - 1) * 0.08)),
            def: Math.floor((monster.base_stats.def || 8) * (1 + (level - 1) * 0.08)),
            dex: Math.floor((monster.base_stats.dex || 10) * (1 + (level - 1) * 0.05)),
            int: Math.floor((monster.base_stats.int || 5) * (1 + (level - 1) * 0.08)),
            cha: Math.floor((monster.base_stats.cha || 5) * (1 + (level - 1) * 0.08))
        };
        
        return stats;
    },
    
    canEvolve(monsterId) {
        const monster = this.monsters[monsterId];
        return monster && monster.next && monster.next.length > 0;
    },
    
    getNextEvolutions(monsterId) {
        const monster = this.monsters[monsterId];
        if (!monster || !monster.next) return [];
        
        return monster.next
            .map(nextId => this.monsters[nextId])
            .filter(m => m != null);
    },
    
    getAllMonsters() {
        return Object.values(this.monsters);
    },
    
    getMonstersByElement(element) {
        return Object.values(this.monsters).filter(m => m.element === element);
    }
};

async function initGameData() {
    await SkillDataManager.loadAllSkillSystems();
    await MonsterDataManager.loadAllMonsterData();
    await ElementDataManager.loadElementData();
    await RoomDataManager.loadRoomData();
    await FoodDataManager.loadFoodData();
    console.log('遊戲資料載入完成');
    console.log('Elements loaded:', ElementDataManager.elements);
}
