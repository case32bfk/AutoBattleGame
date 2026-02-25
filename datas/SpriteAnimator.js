const __BASE_PATH = typeof BASE_PATH !== 'undefined' ? BASE_PATH : '';

const SpriteAnimator = (function() {
    const imageCache = {};
    const preloadPromises = {};
    
    function preloadImages(baseName) {
        const cacheKey = `monster/${baseName}`;
        
        if (imageCache[cacheKey]) {
            return Promise.resolve(imageCache[cacheKey]);
        }
        
        if (preloadPromises[cacheKey]) {
            return preloadPromises[cacheKey];
        }
        
        const promise = new Promise((resolve, reject) => {
            const images = {
                frame1: new Image(),
                frame2: new Image()
            };
            
            let loadedCount = 0;
            const totalImages = 2;
            
            const onLoad = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    imageCache[cacheKey] = images;
                    delete preloadPromises[cacheKey];
                    resolve(images);
                }
            };
            
            const onError = () => {
                delete preloadPromises[cacheKey];
                console.warn(`Failed to preload images for: ${baseName}`);
                resolve(null);
            };
            
            images.frame1.onload = onLoad;
            images.frame1.onerror = onError;
            images.frame2.onload = onLoad;
            images.frame2.onerror = onError;
            
            images.frame1.src = `${__BASE_PATH}datas/images/monster/${baseName}/${baseName}_1.png`;
            images.frame2.src = `${__BASE_PATH}datas/images/monster/${baseName}/${baseName}_2.png`;
        });
        
        preloadPromises[cacheKey] = promise;
        return promise;
    }
    
    function preloadAllMonsters(monsters) {
        const promises = [];
        
        monsters.forEach(monster => {
            if (monster.image_name) {
                promises.push(preloadImages(monster.image_name));
            }
        });
        
        return Promise.all(promises);
    }
    
    return {
        preload(baseName) {
            return preloadImages(baseName);
        },
        
        preloadAll(monsters) {
            return preloadAllMonsters(monsters);
        },
        
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
            
            this.stop(imageElement);
            
            const cacheKey = `monster/${baseName}`;
            const cachedImages = imageCache[cacheKey];
            
            if (!cachedImages) {
                console.warn(`Images not preloaded for: ${baseName}, loading now...`);
                preloadImages(baseName).then(loadedImages => {
                    if (loadedImages) {
                        this._playWithCachedImages(imageElement, baseName, loadedImages, options);
                    } else {
                        if (onComplete) onComplete();
                    }
                });
                return;
            }
            
            this._playWithCachedImages(imageElement, baseName, cachedImages, options);
        },
        
        _playWithCachedImages(imageElement, baseName, cachedImages, options) {
            const {
                frame1Callback = null,
                frame2Callback = null,
                duration = 250,
                loopCount = 4,
                onComplete = null
            } = options;
            
            const state = {
                currentLoop: 0,
                isOdd: true,
                intervalId: null,
                imageElement,
                cachedImages,
                onComplete
            };
            
            const animate = () => {
                if (state.currentLoop >= loopCount) {
                    clearInterval(state.intervalId);
                    imageElement.src = cachedImages.frame1.src;
                    if (onComplete) onComplete();
                    return;
                }
                
                if (state.isOdd) {
                    imageElement.src = cachedImages.frame2.src;
                    if (frame2Callback) frame2Callback();
                } else {
                    imageElement.src = cachedImages.frame1.src;
                    if (frame1Callback) frame1Callback();
                    state.currentLoop++;
                }
                
                state.isOdd = !state.isOdd;
            };
            
            imageElement.src = cachedImages.frame2.src;
            if (frame2Callback) frame2Callback();
            
            state.intervalId = setInterval(animate, duration);
            
            imageElement._spriteAnimatorState = state;
        },
        
        stop(imageElement) {
            if (imageElement._spriteAnimatorState) {
                clearInterval(imageElement._spriteAnimatorState.intervalId);
                delete imageElement._spriteAnimatorState;
            }
        },
        
        isPreloaded(baseName) {
            return !!imageCache[`monster/${baseName}`];
        },
        
        getCachedImages(baseName) {
            return imageCache[`monster/${baseName}`] || null;
        },
        
        clearCache() {
            Object.keys(imageCache).forEach(key => delete imageCache[key]);
        }
    };
})();
