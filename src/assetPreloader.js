// Optimized Asset Preloader with Loading Progress
import { PRIZE_ASSETS, APP_IMAGES } from './assets/assets.js';

class AssetPreloader {
    constructor() {
        this.loadedCount = 0;
        this.totalAssets = 0;
        this.loadedAssets = new Map();
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
        this.preloadStartTime = null;
    }

    // Preload all essential assets
    async preloadAssets(onProgress, onComplete) {
        this.onProgressCallback = onProgress;
        this.onCompleteCallback = onComplete;
        this.preloadStartTime = performance.now();
        
        // Collect all image URLs that need to be preloaded
        const imageUrls = this.collectImageUrls();
        this.totalAssets = imageUrls.length;
        
        console.log(`🎰 Starting preload of ${this.totalAssets} assets...`);
        
        // Create loading promises for all images
        const loadPromises = imageUrls.map((url, index) => 
            this.preloadImage(url, index)
        );
        
        try {
            // Wait for all images to load (or fail gracefully)
            await Promise.allSettled(loadPromises);
            
            const loadTime = performance.now() - this.preloadStartTime;
            console.log(`✅ Asset preloading completed in ${Math.round(loadTime)}ms`);
            console.log(`📊 Successfully loaded: ${this.loadedAssets.size}/${this.totalAssets} assets`);
            
            if (this.onCompleteCallback) {
                this.onCompleteCallback(this.loadedAssets);
            }
        } catch (error) {
            console.error('❌ Asset preloading error:', error);
            // Even if some assets fail, we should still proceed
            if (this.onCompleteCallback) {
                this.onCompleteCallback(this.loadedAssets);
            }
        }
    }

    // Collect all image URLs from various sources
    collectImageUrls() {
        const urls = new Set(); // Use Set to avoid duplicates
        
        // Add prize assets
        PRIZE_ASSETS.forEach(asset => {
            urls.add(asset.path);
        });
        
        // Add app images
        Object.values(APP_IMAGES).forEach(asset => {
            urls.add(asset.path);
        });
        
        // Add any other critical images (header logo, etc.)
        urls.add('./assets/images/Pursuing Potential Logo.png');
        
        // Also add commonly used image paths that might appear in the DOM
        urls.add('/slot-machine-app/assets/images/Pursuing%20Potential%20Logo.png');
        
        return Array.from(urls).filter(url => url && url.trim() !== '');
    }

    // Preload a single image with error handling
    preloadImage(url, index) {
        return new Promise((resolve) => {
            const img = new Image();
            
            // Optimize loading performance
            img.loading = 'eager';
            img.decoding = 'async';
            img.crossOrigin = 'anonymous'; // Handle CORS if needed
            
            // Set up timeout to prevent hanging
            const timeout = setTimeout(() => {
                console.warn(`⏰ Timeout loading image: ${url}`);
                this.handleImageLoad(url, index, false);
                resolve({ success: false, url, reason: 'timeout' });
            }, 10000); // 10 second timeout
            
            img.onload = () => {
                clearTimeout(timeout);
                this.handleImageLoad(url, index, true, img);
                resolve({ success: true, url });
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                console.warn(`⚠️  Failed to load image: ${url}`);
                this.handleImageLoad(url, index, false);
                resolve({ success: false, url, reason: 'error' });
            };
            
            // Start loading
            img.src = url;
        });
    }

    // Handle image load completion (success or failure)
    handleImageLoad(url, index, success, imgElement = null) {
        this.loadedCount++;
        
        if (success && imgElement) {
            this.loadedAssets.set(url, {
                url,
                element: imgElement,
                loaded: true,
                index
            });
        }
        
        // Update progress
        const progress = (this.loadedCount / this.totalAssets) * 100;
        if (this.onProgressCallback) {
            this.onProgressCallback(progress, this.loadedCount, this.totalAssets);
        }
    }

    // Get a preloaded image element
    getPreloadedImage(url) {
        const asset = this.loadedAssets.get(url);
        return asset && asset.loaded ? asset.element : null;
    }

    // Check if all assets are loaded
    isComplete() {
        return this.loadedCount >= this.totalAssets;
    }

    // Get loading statistics
    getStats() {
        return {
            loaded: this.loadedCount,
            total: this.totalAssets,
            percentage: this.totalAssets > 0 ? (this.loadedCount / this.totalAssets) * 100 : 0,
            loadedUrls: Array.from(this.loadedAssets.keys())
        };
    }
}

// Export singleton instance
export const assetPreloader = new AssetPreloader();