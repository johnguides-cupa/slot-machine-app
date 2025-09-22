// webOS-Optimized Animation Manager - Lightweight Alternative to GSAP
class WebOSAnimationManager {
    constructor() {
        this.isSpinning = false;
        this.reelHeight = null;
        this.idleTimelines = [];
        this.activeAnimations = new Set();
        
        // webOS optimization settings
        this.useRAF = true; // Use requestAnimationFrame for smoothness
        this.maxConcurrentAnimations = 3; // Limit concurrent animations
        this.performanceMode = true; // Enable performance optimizations
    }

    // Lightweight CSS-based animation for simple transforms
    cssAnimate(element, properties, duration = 1000, easing = 'ease') {
        return new Promise(resolve => {
            const startTime = performance.now();
            const startValues = {};
            const targetValues = {};

            // Parse properties and get current values
            Object.keys(properties).forEach(prop => {
                if (prop === 'y') {
                    startValues.y = this.getCurrentY(element);
                    targetValues.y = properties.y;
                }
                if (prop === 'scale') {
                    startValues.scale = this.getCurrentScale(element);
                    targetValues.scale = properties.scale;
                }
                if (prop === 'opacity') {
                    startValues.opacity = parseFloat(getComputedStyle(element).opacity) || 1;
                    targetValues.opacity = properties.opacity;
                }
            });

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Apply easing
                const easedProgress = this.applyEasing(progress, easing);

                // Apply transforms
                Object.keys(targetValues).forEach(prop => {
                    const start = startValues[prop];
                    const target = targetValues[prop];
                    const current = start + (target - start) * easedProgress;

                    if (prop === 'y') {
                        element.style.transform = `translateY(${current}px) translateZ(0)`;
                    } else if (prop === 'scale') {
                        element.style.transform = `scale(${current}) translateZ(0)`;
                    } else if (prop === 'opacity') {
                        element.style.opacity = current;
                    }
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    // Apply easing functions optimized for webOS
    applyEasing(progress, easing) {
        switch (easing) {
            case 'linear':
                return progress;
            case 'ease-out':
                return 1 - Math.pow(1 - progress, 2);
            case 'ease-in':
                return Math.pow(progress, 2);
            case 'ease-in-out':
                return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            default: // 'ease'
                return progress * progress * (3 - 2 * progress);
        }
    }

    // Get current Y transform value
    getCurrentY(element) {
        const transform = getComputedStyle(element).transform;
        if (transform === 'none') return 0;
        
        const matrix = transform.match(/matrix.*\((.+)\)/);
        if (matrix) {
            const values = matrix[1].split(', ');
            return parseFloat(values[5]) || 0;
        }
        return 0;
    }

    // Get current scale value
    getCurrentScale(element) {
        const transform = getComputedStyle(element).transform;
        if (transform === 'none') return 1;
        
        const matrix = transform.match(/matrix.*\((.+)\)/);
        if (matrix) {
            const values = matrix[1].split(', ');
            return parseFloat(values[0]) || 1;
        }
        return 1;
    }

    // Optimized spinning animation using CSS transforms + RAF
    async optimizedSpin(targetPrize, prizes, slotIcons) {
        if (this.isSpinning) return;
        this.isSpinning = true;

        console.log('🚀 Starting webOS-optimized spin animation');

        const reels = Array.from(document.querySelectorAll('.reel .reel-strip'));
        const reelContainers = Array.from(document.querySelectorAll('.reel'));
        const spinButton = document.getElementById('spinButton');

        // Add performance classes
        reelContainers.forEach(reel => {
            reel.classList.add('reel-spinning');
        });

        // Disable spin button
        spinButton.disabled = true;
        spinButton.querySelector('.button-text').textContent = 'SPINNING...';

        // Play spin sound
        if (window.soundManager) {
            window.soundManager.onSpinStart();
        }

        // Use CSS animations for spinning phase
        const spinPromises = reels.map((reel, i) => {
            return this.performWebOSSpin(reel, i);
        });

        await Promise.all(spinPromises);

        // Remove performance classes
        reelContainers.forEach(reel => {
            reel.classList.remove('reel-spinning');
        });

        // Re-enable spin button
        spinButton.disabled = false;
        spinButton.querySelector('.button-text').textContent = 'SPIN!';
        this.isSpinning = false;

        console.log('✅ webOS-optimized spin complete');

        // Show popup
        setTimeout(() => {
            this.showPrizePopup(targetPrize);
        }, 100);
    }

    // Perform individual reel spin with CSS optimization
    performWebOSSpin(reel, index) {
        return new Promise(resolve => {
            const spinDuration = 2000 + (index * 500); // Staggered timing
            const initialY = this.getCurrentY(reel);
            const spinDistance = this.reelHeight * 20; // Total spin distance

            // Use CSS animation for smooth spinning
            reel.style.transition = `transform ${spinDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            reel.style.transform = `translateY(${initialY - spinDistance}px) translateZ(0)`;

            setTimeout(() => {
                // Stop at target position
                const finalY = this.calculateTargetPosition(index);
                reel.style.transition = `transform 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
                reel.style.transform = `translateY(${finalY}px) translateZ(0)`;

                setTimeout(() => {
                    reel.style.transition = '';
                    if (window.soundManager) {
                        window.soundManager.onReelStop();
                    }
                    resolve();
                }, 800);
            }, spinDuration);
        });
    }

    // Calculate target position for landing
    calculateTargetPosition(reelIndex) {
        // Simplified calculation for demo
        return -(this.reelHeight * 15); // Land on 15th item
    }

    // Fallback methods to maintain compatibility
    createReelItems = (prizes, defaultPrize = null) => {
        // Use existing method from GSAP version
        return window.animationManager.createReelItems(prizes, defaultPrize);
    }

    createReelItem = (prize) => {
        // Use existing method from GSAP version
        return window.animationManager.createReelItem(prize);
    }

    populateReels = (prizes) => {
        // Use existing method from GSAP version
        return window.animationManager.populateReels(prizes);
    }

    showPrizePopup = (prize) => {
        // Use existing method from GSAP version
        return window.animationManager.showPrizePopup(prize);
    }

    // Performance monitoring
    logPerformanceStats() {
        console.log('📊 webOS Animation Performance:');
        console.log(`- Active animations: ${this.activeAnimations.size}`);
        console.log(`- Performance mode: ${this.performanceMode ? 'ON' : 'OFF'}`);
        console.log(`- Memory usage: ${(performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`);
    }
}

// Export for optional use
window.WebOSAnimationManager = WebOSAnimationManager;