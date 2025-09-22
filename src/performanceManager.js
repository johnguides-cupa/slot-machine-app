// Performance Mode Manager for LG webOS and Low-Spec Device Optimization
class PerformanceManager {
    constructor() {
        this.mode = this.getStoredMode() || null; // null means not set yet
        this.listeners = [];
        this.initialized = false;
        
        // Performance mode configurations
        this.configs = {
            'high-quality': {
                name: 'High Quality Mode',
                description: 'Full visual effects and smooth animations\n(Recommended for PC and modern devices)',
                icon: '🚀',
                settings: {
                    useGSAPAnimations: true,
                    enableParticleEffects: true,
                    useAdvancedEasing: true,
                    enableSoundOverlap: true,
                    useHighResImages: true,
                    enableHoverEffects: true,
                    enableShadowEffects: true,
                    animationDuration: 'normal',
                    enableBackgroundEffects: true
                }
            },
            'performance': {
                name: 'Performance Mode',
                description: 'Optimized for Smart TVs and slower devices\n(Reduces lag and improves responsiveness)',
                icon: '⚡',
                settings: {
                    useGSAPAnimations: false, // Use CSS transforms instead
                    enableParticleEffects: false,
                    useAdvancedEasing: false, // Linear/ease only
                    enableSoundOverlap: false, // Sequential audio only
                    useHighResImages: false,
                    enableHoverEffects: false,
                    enableShadowEffects: false,
                    animationDuration: 'fast',
                    enableBackgroundEffects: false
                }
            }
        };
    }

    // Get stored performance mode from localStorage
    getStoredMode() {
        try {
            return localStorage.getItem('slotMachine_performanceMode');
        } catch (error) {
            console.warn('localStorage not available for performance mode');
            return null;
        }
    }

    // Set and store performance mode
    setMode(mode) {
        if (!this.configs[mode]) {
            console.error(`Invalid performance mode: ${mode}`);
            return false;
        }

        this.mode = mode;
        
        try {
            localStorage.setItem('slotMachine_performanceMode', mode);
        } catch (error) {
            console.warn('Could not save performance mode to localStorage');
        }

        console.log(`🎯 Performance mode set to: ${this.configs[mode].name}`);
        
        // Notify all listeners about mode change
        this.notifyListeners();
        
        return true;
    }

    // Get current mode
    getMode() {
        return this.mode;
    }

    // Check if user has made a choice
    hasUserChosen() {
        return this.mode !== null;
    }

    // Get mode configuration
    getConfig(mode = null) {
        const targetMode = mode || this.mode;
        return targetMode ? this.configs[targetMode] : null;
    }

    // Get current settings
    getSettings() {
        const config = this.getConfig();
        return config ? config.settings : {};
    }

    // Get all available modes
    getAvailableModes() {
        return Object.keys(this.configs);
    }

    // Get mode info for UI display
    getModeInfo(mode) {
        return this.configs[mode] || null;
    }

    // Check specific setting
    isEnabled(settingName) {
        const settings = this.getSettings();
        return settings[settingName] === true;
    }

    // Add listener for mode changes
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Remove listener
    removeListener(callback) {
        this.listeners = this.listeners.filter(listener => listener !== callback);
    }

    // Notify all listeners of mode change
    notifyListeners() {
        const config = this.getConfig();
        this.listeners.forEach(listener => {
            try {
                listener(this.mode, config);
            } catch (error) {
                console.error('Error notifying performance mode listener:', error);
            }
        });
    }

    // Initialize performance optimizations based on current mode
    initialize() {
        if (this.initialized) return;
        
        if (this.mode) {
            this.applyPerformanceOptimizations();
        }
        
        this.initialized = true;
        console.log('✅ Performance Manager initialized');
    }

    // Initialize with a specific mode (for returning users)
    initializeMode(mode) {
        if (!this.configs[mode]) {
            console.warn(`Invalid performance mode: ${mode}, using default`);
            mode = 'high-quality';
        }
        
        this.setMode(mode);
        
        if (!this.initialized) {
            this.initialize();
        }
        
        console.log(`🔄 Performance Manager initialized with mode: ${mode}`);
    }

    // Apply CSS and DOM optimizations based on current mode
    applyPerformanceOptimizations() {
        const settings = this.getSettings();
        const body = document.body;
        
        // Add performance mode class to body
        body.classList.remove('performance-high', 'performance-low');
        body.classList.add(this.mode === 'performance' ? 'performance-low' : 'performance-high');
        
        // Apply GPU acceleration for performance mode
        if (this.mode === 'performance') {
            this.enableGPUAcceleration();
        }
        
        // Disable hover effects in performance mode
        if (!settings.enableHoverEffects) {
            this.disableHoverEffects();
        }
        
        console.log(`⚡ Applied optimizations for ${this.getConfig().name}`);
    }

    // Enable GPU acceleration for better performance
    enableGPUAcceleration() {
        const style = document.createElement('style');
        style.id = 'performance-gpu-acceleration';
        style.textContent = `
            .reel, .reel-strip, .reel-item {
                transform: translateZ(0);
                backface-visibility: hidden;
                will-change: transform;
            }
            
            .slot-machine, .prize-popup, .popup-content {
                transform: translateZ(0);
                backface-visibility: hidden;
            }
        `;
        document.head.appendChild(style);
    }

    // Disable hover effects for performance
    disableHoverEffects() {
        const style = document.createElement('style');
        style.id = 'performance-no-hover';
        style.textContent = `
            * {
                transition: none !important;
            }
            
            .spin-button:hover,
            .prize-item:hover,
            .close-button:hover {
                transform: none !important;
                box-shadow: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Clear all performance styles
    clearPerformanceStyles() {
        const styles = ['performance-gpu-acceleration', 'performance-no-hover'];
        styles.forEach(id => {
            const style = document.getElementById(id);
            if (style) style.remove();
        });
    }

    // Reset performance mode (for testing)
    reset() {
        try {
            localStorage.removeItem('slotMachine_performanceMode');
        } catch (error) {
            console.warn('Could not clear performance mode from localStorage');
        }
        
        this.mode = null;
        this.clearPerformanceStyles();
        document.body.classList.remove('performance-high', 'performance-low');
        
        console.log('🔄 Performance mode reset');
    }

    // Get performance statistics
    getStats() {
        return {
            currentMode: this.mode,
            hasChosen: this.hasUserChosen(),
            isInitialized: this.initialized,
            availableModes: this.getAvailableModes(),
            currentSettings: this.getSettings()
        };
    }
}

// Export singleton instance
export const performanceManager = new PerformanceManager();

// Add to global scope for easy debugging
if (typeof window !== 'undefined') {
    window.performanceManager = performanceManager;
}