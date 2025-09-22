// webOS-Optimized Asset Preloader with Progressive Loading
import { PRIZE_ASSETS, APP_IMAGES } from './assets/assets.js';

class AssetPreloader {
    constructor() {
        this.loadedCount = 0;
        this.totalAssets = 0;
        this.loadedAssets = new Map();
        this.onProgressCallback = null;
        this.onCompleteCallback = null;
        this.preloadStartTime = null;
        
        // webOS optimization settings
        this.maxConcurrentLoads = 3; // Limit concurrent downloads for TV networks
        this.maxImageSize = 500 * 1024; // 500KB max for webOS performance
        this.preferredFormat = 'webp'; // Prefer WebP when available
        this.tvResolution = { width: 1920, height: 1080 }; // Standard Smart TV resolution
    }

    // Progressive asset preloading optimized for webOS
    async preloadAssets(onProgress, onComplete) {
        this.onProgressCallback = onProgress;
        this.onCompleteCallback = onComplete;
        this.preloadStartTime = performance.now();
        
        // Collect and prioritize image URLs
        const { criticalAssets, standardAssets } = this.prioritizeAssets();
        this.totalAssets = criticalAssets.length + standardAssets.length;
        
        console.log(`🎰 webOS Progressive Loading: ${criticalAssets.length} critical + ${standardAssets.length} standard assets`);
        
        try {
            // Phase 1: Load critical assets first (logos, UI elements)
            console.log('📥 Phase 1: Loading critical assets...');
            await this.loadAssetBatch(criticalAssets, true);
            
            // Phase 2: Load standard assets with concurrency control
            console.log('📥 Phase 2: Loading standard assets...');
            await this.loadAssetBatch(standardAssets, false);
            
            const loadTime = performance.now() - this.preloadStartTime;
            console.log(`✅ webOS Asset loading completed in ${Math.round(loadTime)}ms`);
            console.log(`📊 Successfully loaded: ${this.loadedAssets.size}/${this.totalAssets} assets`);
            
            if (this.onCompleteCallback) {
                this.onCompleteCallback(this.loadedAssets);
            }
        } catch (error) {
            console.error('❌ webOS Asset loading error:', error);
            if (this.onCompleteCallback) {
                this.onCompleteCallback(this.loadedAssets);
            }
        }
    }

    // Prioritize assets for progressive loading
    prioritizeAssets() {
        const allUrls = this.collectImageUrls();
        
        // Critical assets (load first): logos, UI elements, fallback images
        const criticalAssets = allUrls.filter(url => 
            url.includes('Logo') || 
            url.includes('cat_') || 
            url.includes('Sad_cat') ||
            url.includes('header')
        );
        
        // Standard assets (load second): prize images
        const standardAssets = allUrls.filter(url => !criticalAssets.includes(url));
        
        return { criticalAssets, standardAssets };
    }

    // Load assets in batches with concurrency control
    async loadAssetBatch(urls, isCritical) {
        const batchSize = isCritical ? 2 : this.maxConcurrentLoads;
        
        for (let i = 0; i < urls.length; i += batchSize) {
            const batch = urls.slice(i, i + batchSize);
            const batchPromises = batch.map((url, batchIndex) => 
                this.preloadImageOptimized(url, i + batchIndex, isCritical)
            );
            
            // Wait for current batch before starting next (webOS network limitation)
            await Promise.allSettled(batchPromises);
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

    // webOS-optimized image preloading with size optimization
    preloadImageOptimized(url, index, isCritical = false) {
        return new Promise((resolve) => {
            const img = new Image();
            
            // webOS TV optimizations
            img.loading = isCritical ? 'eager' : 'lazy';
            img.decoding = 'async'; // Async decoding for better performance
            img.crossOrigin = 'anonymous';
            
            // GPU acceleration hints for webOS
            img.style.willChange = 'transform';
            img.style.transform = 'translateZ(0)';
            img.style.backfaceVisibility = 'hidden';
            
            // Shorter timeout for critical assets, longer for standard
            const timeoutDuration = isCritical ? 10000 : 20000; // 10s vs 20s
            const timeout = setTimeout(() => {
                console.warn(`⏰ webOS timeout loading ${isCritical ? 'critical' : 'standard'} image: ${url}`);
                this.handleImageLoad(url, index, false);
                resolve({ success: false, url, reason: 'timeout' });
            }, timeoutDuration);
            
            img.onload = () => {
                clearTimeout(timeout);
                
                // Check image size for webOS optimization warnings
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0);
                
                // Estimate file size (rough approximation)
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const estimatedSize = imageData.data.length;
                
                if (estimatedSize > this.maxImageSize) {
                    console.warn(`📊 Large image detected (${Math.round(estimatedSize/1024)}KB): ${url}`);
                    console.warn(`💡 Consider optimizing for webOS Smart TV performance`);
                }
                
                // Optimize image for TV display
                this.optimizeForTV(img, canvas, ctx);
                
                // Force decode for webOS caching
                if (img.decode) {
                    img.decode().then(() => {
                        this.handleImageLoad(url, index, true, img);
                        resolve({ success: true, url, optimized: true });
                    }).catch(() => {
                        this.handleImageLoad(url, index, true, img);
                        resolve({ success: true, url, optimized: false });
                    });
                } else {
                    this.handleImageLoad(url, index, true, img);
                    resolve({ success: true, url, optimized: false });
                }
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                console.warn(`⚠️ webOS failed to load image: ${url}`);
                this.handleImageLoad(url, index, false);
                resolve({ success: false, url, reason: 'error' });
            };
            
            // Start loading
            img.src = url;
        });
    }

    // Optimize image display for Smart TV resolution
    optimizeForTV(img, canvas, ctx) {
        const { width: tvWidth, height: tvHeight } = this.tvResolution;
        
        // If image is larger than TV resolution, suggest optimization
        if (img.naturalWidth > tvWidth || img.naturalHeight > tvHeight) {
            console.log(`📺 Image larger than TV resolution: ${img.naturalWidth}x${img.naturalHeight} > ${tvWidth}x${tvHeight}`);
            
            // Apply CSS optimization hints
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.imageRendering = 'auto'; // Let browser optimize
        }
        
        // webOS memory optimization
        img.style.transformOrigin = 'center';
        img.style.backfaceVisibility = 'hidden';
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

    // Get loading statistics with webOS optimization info
    getStats() {
        const failedAssets = this.totalAssets - this.loadedAssets.size;
        const successRate = this.totalAssets > 0 ? (this.loadedAssets.size / this.totalAssets) * 100 : 0;
        
        return {
            loaded: this.loadedAssets.size,
            failed: failedAssets,
            total: this.totalAssets,
            percentage: Math.round(successRate),
            loadedUrls: Array.from(this.loadedAssets.keys()),
            webOSOptimized: true,
            maxConcurrentLoads: this.maxConcurrentLoads,
            maxImageSize: `${Math.round(this.maxImageSize/1024)}KB`,
            tvResolution: `${this.tvResolution.width}x${this.tvResolution.height}`
        };
    }

    // Create optimized image element for webOS display
    createOptimizedImage(url, maxWidth = null, maxHeight = null) {
        const preloadedAsset = this.loadedAssets.get(url);
        
        if (preloadedAsset && preloadedAsset.element) {
            const img = preloadedAsset.element.cloneNode();
            
            // Apply webOS optimizations
            img.style.willChange = 'transform';
            img.style.transform = 'translateZ(0)';
            img.style.backfaceVisibility = 'hidden';
            img.style.imageRendering = 'auto';
            
            // Apply size constraints for TV display
            if (maxWidth) img.style.maxWidth = maxWidth + 'px';
            if (maxHeight) img.style.maxHeight = maxHeight + 'px';
            
            // Ensure responsive behavior
            img.style.width = 'auto';
            img.style.height = 'auto';
            
            return img;
        }
        
        // Fallback: create new image with optimizations
        const img = new Image();
        img.src = url;
        img.style.willChange = 'transform';
        img.style.transform = 'translateZ(0)';
        img.style.backfaceVisibility = 'hidden';
        
        return img;
    }

    // Log webOS optimization recommendations
    logOptimizationRecommendations() {
        console.log('🔧 webOS Asset Optimization Recommendations:');
        console.log('📱 Recommended max image size: 500KB');
        console.log('📺 Recommended max resolution: 1920x1080');
        console.log('🎯 Use WebP format when possible');
        console.log('⚡ Consider progressive JPEG for large images');
        console.log('🔄 Implement lazy loading for non-critical assets');
        
        // Check current assets for optimization opportunities
        const stats = this.getStats();
        if (stats.loaded > 0) {
            console.log(`📊 Current: ${stats.loaded}/${stats.total} assets loaded (${stats.percentage}% success)`);
        }
    }
}

// Export singleton instance
export const assetPreloader = new AssetPreloader();