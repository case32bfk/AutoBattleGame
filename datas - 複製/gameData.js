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
            atk: Math.floor(monster.base_stats.atk * (1 + (level - 1) * 0.08)),
            def: Math.floor(monster.base_stats.def * (1 + (level - 1) * 0.08)),
            speed: Math.floor(monster.base_stats.speed * (1 + (level - 1) * 0.05))
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
    console.log('遊戲資料載入完成');
    console.log('Elements loaded:', ElementDataManager.elements);
}
