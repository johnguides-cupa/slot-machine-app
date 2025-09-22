// webOS-Enhanced Asset loader with loading screen and optimization warnings
class AssetLoader {
    constructor() {
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.failedAssets = 0;
        this.loadingCallbacks = [];
        this.completionCallbacks = [];
        this.isLoading = false;
        this.loadedAudioObjects = {}; // Store loaded Audio objects
        this.loadedImageObjects = {}; // Store loaded Image objects
        
        // webOS optimization tracking
        this.largeImageWarnings = [];
        this.maxImageSizeKB = 500; // webOS recommended max
        this.optimizationAdvice = [];
    }

    // Add callback for loading progress updates
    onProgress(callback) {
        this.loadingCallbacks.push(callback);
    }

    // Add callback for when all assets are loaded
    onComplete(callback) {
        this.completionCallbacks.push(callback);
    }

    // Update loading progress
    updateProgress() {
        const progress = Math.round((this.loadedAssets / this.totalAssets) * 100);
        this.loadingCallbacks.forEach(callback => {
            callback(progress, this.loadedAssets, this.totalAssets, this.failedAssets);
        });

        // Check if all assets are loaded
        if (this.loadedAssets + this.failedAssets >= this.totalAssets) {
            this.isLoading = false;
            this.completionCallbacks.forEach(callback => {
                callback(this.failedAssets === 0, this.failedAssets);
            });
        }
    }

    // Load a single image with webOS optimization monitoring and fallback path
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            // webOS optimizations
            img.loading = 'eager';
            img.decoding = 'async';
            img.crossOrigin = 'anonymous';
            
            // GPU acceleration hints
            img.style.willChange = 'transform';
            img.style.transform = 'translateZ(0)';
            img.style.backfaceVisibility = 'hidden';
            
            img.onload = () => {
                this.loadedAssets++;
                
                // Store the loaded image object
                this.loadedImageObjects[src] = img;
                
                // Monitor image size for webOS optimization warnings
                this.checkImageOptimization(img, src);
                
                this.updateProgress();
                resolve(img);
            };
            
            img.onerror = () => {
                // Try fallback path for development mode
                if (src.startsWith('/slot-machine-app/')) {
                    const fallbackSrc = src.replace('/slot-machine-app', '');
                    const fallbackImg = new Image();
                    
                    // Apply same webOS optimizations to fallback
                    fallbackImg.loading = 'eager';
                    fallbackImg.decoding = 'async';
                    fallbackImg.crossOrigin = 'anonymous';
                    fallbackImg.style.willChange = 'transform';
                    fallbackImg.style.transform = 'translateZ(0)';
                    fallbackImg.style.backfaceVisibility = 'hidden';
                    
                    fallbackImg.onload = () => {
                        this.loadedAssets++;
                        this.loadedImageObjects[src] = fallbackImg;
                        this.checkImageOptimization(fallbackImg, src);
                        this.updateProgress();
                        resolve(fallbackImg);
                    };
                    
                    fallbackImg.onerror = () => {
                        this.failedAssets++;
                        console.warn(`Failed to load image: ${src} and fallback: ${fallbackSrc}`);
                        this.updateProgress();
                        reject(new Error(`Failed to load image: ${src}`));
                    };
                    
                    fallbackImg.src = fallbackSrc;
                } else {
                    this.failedAssets++;
                    console.warn(`Failed to load image: ${src}`);
                    this.updateProgress();
                    reject(new Error(`Failed to load image: ${src}`));
                }
            };

            img.src = src;
        });
    }

    // Check if image needs optimization for webOS
    checkImageOptimization(img, src) {
        // Estimate file size (rough approximation)
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        try {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const estimatedSizeKB = Math.round(imageData.data.length / 1024);
            
            // Check for optimization opportunities
            if (estimatedSizeKB > this.maxImageSizeKB) {
                const warning = {
                    src,
                    estimatedSizeKB,
                    resolution: `${img.naturalWidth}x${img.naturalHeight}`,
                    advice: `Consider optimizing: Reduce size by ~${Math.round((estimatedSizeKB - this.maxImageSizeKB) / estimatedSizeKB * 100)}%`
                };
                this.largeImageWarnings.push(warning);
                
                console.warn(`📊 webOS: Large image detected - ${src}`);
                console.warn(`   Size: ~${estimatedSizeKB}KB, Resolution: ${warning.resolution}`);
                console.warn(`   Recommendation: ${warning.advice}`);
            }
            
            // Check resolution
            if (img.naturalWidth > 1920 || img.naturalHeight > 1080) {
                this.optimizationAdvice.push({
                    src,
                    type: 'resolution',
                    message: `Resolution ${img.naturalWidth}x${img.naturalHeight} > TV standard (1920x1080)`
                });
            }
            
        } catch (error) {
            // Canvas operations may fail for cross-origin images
            console.log(`Cannot analyze image size for: ${src} (CORS restriction)`);
        }
    }    // Load a single audio file
    loadAudio(src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            const onLoad = () => {
                this.loadedAssets++;
                // Store the loaded audio object
                this.loadedAudioObjects[src] = audio;
                console.log(`🔊 AssetLoader: Successfully loaded audio: ${src}`);
                console.log(`🔊 AssetLoader: Stored audio objects:`, Object.keys(this.loadedAudioObjects));
                this.updateProgress();
                audio.removeEventListener('canplaythrough', onLoad);
                audio.removeEventListener('loadeddata', onLoad);
                audio.removeEventListener('error', onError);
                resolve(audio);
            };
            
            const onError = () => {
                this.failedAssets++;
                console.warn(`Failed to load audio: ${src}`);
                this.updateProgress();
                audio.removeEventListener('canplaythrough', onLoad);
                audio.removeEventListener('loadeddata', onLoad);
                audio.removeEventListener('error', onError);
                reject(new Error(`Failed to load audio: ${src}`));
            };
            
            // Listen for both events to ensure compatibility
            audio.addEventListener('canplaythrough', onLoad);
            audio.addEventListener('loadeddata', onLoad); // Fallback for some browsers
            audio.addEventListener('error', onError);
            
            // Set audio properties for better loading
            audio.preload = 'auto';
            audio.crossOrigin = 'anonymous'; // Handle CORS if needed
            audio.src = src;
            
            // Force loading start
            try {
                audio.load();
            } catch (error) {
                console.warn(`Error starting audio load for ${src}:`, error);
                onError();
            }
        });
    }

    // Load all game assets
    async loadAllAssets() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.loadedAssets = 0;
        this.failedAssets = 0;

        // Get all prize images from storage
        const prizes = JSON.parse(localStorage.getItem('slotPrizes') || '[]');
        const prizeImages = prizes.map(prize => prize.image).filter(img => img && !img.startsWith('http'));

        // Define all assets to load - try development paths first
        const assets = {
            images: [
                '/assets/images/Sad_cat.png',
                '/assets/images/cat_win.png',
                '/assets/images/Pursuing Potential Logo.png',
                ...prizeImages
            ],
            sounds: [
                '/assets/sounds/Congratulations.mp3',
                '/assets/sounds/miaw.mp3'
            ]
        };

        // Count total assets
        this.totalAssets = assets.images.length + assets.sounds.length;

        if (this.totalAssets === 0) {
            // No assets to load
            this.completionCallbacks.forEach(callback => callback(true, 0));
            return;
        }

        // Start loading progress
        this.updateProgress();

        // Load all images
        const imagePromises = assets.images.map(src => 
            this.loadImage(src).catch(error => {
                console.warn('Image load failed but continuing:', error);
                return null; // Don't break the loading process
            })
        );

        // Load all sounds
        const soundPromises = assets.sounds.map(src => 
            this.loadAudio(src).catch(error => {
                console.warn('Sound load failed but continuing:', error);
                return null; // Don't break the loading process
            })
        );

        // Wait for all assets to finish loading (including failures)
        try {
            await Promise.allSettled([...imagePromises, ...soundPromises]);
        } catch (error) {
            console.warn('Some assets failed to load:', error);
        }
    }

    // Get preloaded audio object by source
    getLoadedAudio(src) {
        console.log(`🔊 AssetLoader: Looking for audio with src: ${src}`);
        console.log(`🔊 AssetLoader: Available audio objects:`, Object.keys(this.loadedAudioObjects));
        const audio = this.loadedAudioObjects[src] || null;
        console.log(`🔊 AssetLoader: Found audio:`, !!audio);
        return audio;
    }

    // Get preloaded image object by source
    getLoadedImage(src) {
        return this.loadedImageObjects[src] || null;
    }

    // Create loading screen UI
    createLoadingScreen() {
        // Remove existing loading screen if any
        this.removeLoadingScreen();

        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'assetLoadingScreen';
        loadingScreen.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <h2 class="loading-title">Loading Game Assets</h2>
                    <div class="loading-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-text" id="progressText">0%</div>
                    </div>
                    <div class="loading-details" id="loadingDetails">
                        Preparing assets...
                    </div>
                </div>
            </div>
        `;

        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            #assetLoadingScreen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                background: linear-gradient(135deg, #1e1e2e 0%, #2d1b69 50%, #11011e 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Arial', sans-serif;
            }

            .loading-container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                max-width: 400px;
                width: 90%;
            }

            .loading-spinner {
                width: 60px;
                height: 60px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid #fff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .loading-title {
                color: white;
                font-size: 24px;
                margin-bottom: 30px;
                font-weight: bold;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }

            .loading-progress {
                margin-bottom: 20px;
            }

            .progress-bar {
                width: 100%;
                height: 12px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                overflow: hidden;
                margin-bottom: 10px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #45a049);
                border-radius: 6px;
                width: 0%;
                transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
            }

            .progress-text {
                color: white;
                font-size: 18px;
                font-weight: bold;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
            }

            .loading-details {
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
                margin-top: 15px;
            }

            .loading-error {
                color: #ff6b6b;
                background: rgba(255, 107, 107, 0.1);
                border: 1px solid rgba(255, 107, 107, 0.3);
                border-radius: 8px;
                padding: 10px;
                margin-top: 15px;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(loadingScreen);

        // Set up progress callbacks
        this.onProgress((progress, loaded, total, failed) => {
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const loadingDetails = document.getElementById('loadingDetails');

            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${progress}%`;
            if (loadingDetails) {
                loadingDetails.textContent = `Loading assets: ${loaded}/${total}${failed > 0 ? ` (${failed} failed)` : ''}`;
            }
        });

        this.onComplete((success, failedCount) => {
            const loadingDetails = document.getElementById('loadingDetails');
            const loadingContainer = document.querySelector('.loading-container');
            
            if (loadingDetails) {
                // Generate optimization warnings for webOS
                const optimizationWarnings = this.generateOptimizationReport();
                
                if (success) {
                    loadingDetails.innerHTML = `
                        ✅ All assets loaded successfully!<br>
                        ${optimizationWarnings}
                        <small style="color: rgba(255,255,255,0.7); margin-top: 10px; display: block;">
                            Click anywhere to enable audio and start the game
                        </small>
                    `;
                } else {
                    loadingDetails.innerHTML = `
                        ⚠️ ${failedCount} assets failed to load, but game can still run.<br>
                        ${optimizationWarnings}
                        <small style="color: rgba(255,255,255,0.7); margin-top: 10px; display: block;">
                            Click anywhere to enable audio and start the game
                        </small>
                    `;
                }
            }

            // Add click to continue functionality
            if (loadingContainer) {
                loadingContainer.style.cursor = 'pointer';
                loadingContainer.addEventListener('click', () => {
                    this.removeLoadingScreen();
                });
            }

            // Auto-remove after delay if user doesn't click
            setTimeout(() => {
                this.removeLoadingScreen();
            }, 3000);
        });
    }

    // Remove loading screen
    removeLoadingScreen() {
        const loadingScreen = document.getElementById('assetLoadingScreen');
        if (loadingScreen) {
            loadingScreen.remove();
        }
    }

    // Generate webOS optimization report for loading screen
    generateOptimizationReport() {
        if (this.largeImageWarnings.length === 0 && this.optimizationAdvice.length === 0) {
            return `<div style="color: #4CAF50; font-size: 12px; margin: 8px 0;">📺 webOS optimized - All images TV-ready!</div>`;
        }

        let report = '';
        
        if (this.largeImageWarnings.length > 0) {
            report += `<div style="color: #ff9800; font-size: 11px; margin: 8px 0; background: rgba(255,152,0,0.1); padding: 8px; border-radius: 4px; border: 1px solid rgba(255,152,0,0.3);">
                📊 webOS Performance: ${this.largeImageWarnings.length} large image${this.largeImageWarnings.length > 1 ? 's' : ''} detected<br>
                <small style="color: rgba(255,255,255,0.7);">Consider optimizing for faster TV loading</small>
            </div>`;
        }

        if (this.optimizationAdvice.length > 0) {
            const resolutionIssues = this.optimizationAdvice.filter(advice => advice.type === 'resolution').length;
            if (resolutionIssues > 0) {
                report += `<div style="color: #2196F3; font-size: 11px; margin: 8px 0; background: rgba(33,150,243,0.1); padding: 8px; border-radius: 4px; border: 1px solid rgba(33,150,243,0.3);">
                    📺 ${resolutionIssues} image${resolutionIssues > 1 ? 's' : ''} larger than TV resolution
                </div>`;
            }
        }

        return report;
    }

    // Initialize asset loading with loading screen
    async initializeWithLoadingScreen() {
        this.createLoadingScreen();
        await this.loadAllAssets();
        return new Promise(resolve => {
            this.onComplete(() => {
                setTimeout(() => {
                    resolve();
                }, 1000); // Wait for loading screen to be removed
            });
        });
    }
}

// Global asset loader instance
window.assetLoader = new AssetLoader();
