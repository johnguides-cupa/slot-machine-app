// webOS-Enhanced Main entry point for Vite bundling with Asset Preloading
import { assetPreloader } from './assetPreloader.js';
import { loadingScreen } from './loadingScreen.js';
import './storage.js';
import './sounds.js';
import './animations.js';
import './admin.js';
import './app.js';

// Initialize the application with webOS-optimized asset preloading
async function initializeApp() {
    console.log('🎰 Initializing webOS-Optimized Slot Machine App...');
    
    // Log optimization recommendations for developers
    if (window.assetPreloader && window.assetPreloader.logOptimizationRecommendations) {
        window.assetPreloader.logOptimizationRecommendations();
    }
    
    // Show loading screen immediately
    loadingScreen.show();
    
    // Start asset preloading with webOS optimizations
    await assetPreloader.preloadAssets(
        // Progress callback
        (percentage, loaded, total) => {
            loadingScreen.updateProgress(percentage, loaded, total);
        },
        // Complete callback
        (loadedAssets) => {
            console.log('✅ webOS asset preloading completed');
            
            // Log final optimization stats
            const stats = assetPreloader.getStats();
            console.log('📊 webOS Loading Stats:', stats);
            
            // Small delay to show 100% completion
            setTimeout(() => {
                loadingScreen.hide();
                
                // Make sure the main app is visible
                const appContainer = document.querySelector('.slot-machine-cabinet');
                if (appContainer) {
                    appContainer.style.opacity = '1';
                    appContainer.style.transition = 'opacity 0.5s ease-in';
                }
                
                // Trigger any post-load initialization
                if (window.slotMachine && window.slotMachine.onAssetsLoaded) {
                    window.slotMachine.onAssetsLoaded(loadedAssets);
                }
            }, 300);
        }
    );
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
