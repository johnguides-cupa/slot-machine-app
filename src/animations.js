// Animation manager using GSAP with Performance Mode Support
class AnimationManager {
    constructor() {
        this.isSpinning = false;
        this.reelHeight = null; // Will be set dynamically
        this.idleTimelines = [];
        this.performanceMode = 'high-quality'; // Default to high quality
        
        // Listen for performance mode changes
        this.setupPerformanceModeListener();
    }

    // Setup performance mode listener with retry logic
    setupPerformanceModeListener() {
        if (window.performanceManager) {
            console.log('🎬 Setting up performance mode listener immediately');
            window.performanceManager.addListener((mode, config) => {
                this.onPerformanceModeChange(mode, config);
            });
            // Get current mode
            this.performanceMode = window.performanceManager.getMode();
        } else {
            console.log('🎬 Performance manager not ready, setting up retry...');
            // Retry every 500ms until performanceManager is available
            const retryInterval = setInterval(() => {
                if (window.performanceManager) {
                    console.log('🎬 Performance manager found, setting up listener');
                    window.performanceManager.addListener((mode, config) => {
                        this.onPerformanceModeChange(mode, config);
                    });
                    this.performanceMode = window.performanceManager.getMode();
                    clearInterval(retryInterval);
                }
            }, 500);
        }
    }

    // Handle performance mode changes
    onPerformanceModeChange(mode, config) {
        this.performanceMode = mode;
        console.log(`🎬 Animation system switched to: ${mode}`);
        
        // Apply immediate optimizations
        if (mode === 'performance') {
            this.enablePerformanceOptimizations();
        } else {
            this.disablePerformanceOptimizations();
        }
    }

    // Enable performance optimizations
    enablePerformanceOptimizations() {
        // Force GPU acceleration on all animated elements
        const animatedElements = document.querySelectorAll('.reel, .reel-strip, .reel-item, .prize-popup, .popup-content');
        animatedElements.forEach(el => {
            el.style.transform = 'translateZ(0)';
            el.style.willChange = 'transform';
            el.style.backfaceVisibility = 'hidden';
        });
    }

    // Disable performance optimizations (restore high quality)
    disablePerformanceOptimizations() {
        const animatedElements = document.querySelectorAll('.reel, .reel-strip, .reel-item, .prize-popup, .popup-content');
        animatedElements.forEach(el => {
            el.style.transform = '';
            el.style.willChange = '';
            el.style.backfaceVisibility = '';
        });
    }

    // Get animation settings based on current performance mode
    getAnimationSettings() {
        // Check for current performance mode from performanceManager if available
        if (window.performanceManager) {
            this.performanceMode = window.performanceManager.getMode();
        }
        
        const isPerformanceMode = this.performanceMode === 'performance';
        console.log(`🎬 Getting animation settings - Mode: ${this.performanceMode}, IsPerformanceMode: ${isPerformanceMode}`);
        
        return {
            // Spin settings - subtle but important differences
            spinDuration: isPerformanceMode ? 0.08 : 0.12, // Slightly faster spins in performance mode
            spinEase: "none", // Keep linear for both modes for consistent feel
            stopDuration: isPerformanceMode ? 0.6 : 1.0, // Faster stops in performance mode
            stopEase: isPerformanceMode ? "power2.out" : "power2.out", // Same easing, just faster

            // Prize popup settings - minimal differences
            popupScale: true, // Keep scaling for both modes
            popupDuration: isPerformanceMode ? 0.3 : 0.4, // Slightly faster popup in performance mode
            popupEase: isPerformanceMode ? "back.out(1.2)" : "back.out(1.7)", // Less bounce in performance mode

            // Confetti settings - REDUCED for all modes
            enableConfetti: true, // Always allow, but minimal
            confettiAmount: 4, // Minimal visible particles
            confettiInterval: 400, // Moderate frequency for visibility
            confettiMultiplier: 1, // No doubling

            // Idle animations
            enableIdleAnimations: !isPerformanceMode, // Disable idle animations in performance mode

            // Performance optimizations (these are the real improvements)
            enableGPUAcceleration: isPerformanceMode, // Enable GPU acceleration in performance mode
            reduceAnimationComplexity: isPerformanceMode // Simplify animations in performance mode
        };
    }

    // Create reel items for animation
    createReelItems(prizes, defaultPrize = null) {
        const items = [];
        
        // Add all prizes multiple times for seamless animation
        for (let i = 0; i < 15; i++) {
            prizes.forEach(prize => {
                items.push(this.createReelItem(prize));
            });
        }
        
        return items;
    }

    createReelItem(prize) {
        const item = document.createElement('div');
        item.className = 'reel-item';
        item.innerHTML = `
            <img src="${prize.image}" alt="${prize.name}" onerror="this.src='/assets/images/Sad_cat.png'">
        `;
        // Dynamically set reelHeight if not set
        if (!this.reelHeight) {
            document.body.appendChild(item);
            this.reelHeight = item.offsetHeight;
            document.body.removeChild(item);
        }
        return item;
    }

    // Populate reels with items
    populateReels(prizes) {
        const reels = document.querySelectorAll('.reel');
        
        reels.forEach((reel, index) => {
            const strip = reel.querySelector('.reel-strip');
            strip.innerHTML = '';
            
            const items = this.createReelItems(prizes);
            items.forEach(item => strip.appendChild(item));
            
            // Position reel to show first prize initially
            gsap.set(strip, { y: -this.reelHeight });
        });
        // Start idle animation after populating reels
        this.startIdleAnimation();
    }
    // Idle animation: slow continuous spinning
    startIdleAnimation() {
        this.stopIdleAnimation();
    const reels = Array.from(document.querySelectorAll('.reel .reel-strip'));
        this.idleTimelines = [];
        // Use different intervals for each reel
        const durations = [6, 7.5, 9]; // You can tweak these for more/less variation
        reels.forEach((reel, i) => {
            const timeline = gsap.timeline({ repeat: -1 });
            const startY = gsap.getProperty(reel, 'y');
            const endY = startY - this.reelHeight * 10;
            timeline.to(reel, {
                y: endY,
                duration: durations[i % durations.length],
                ease: 'linear',
            });
            this.idleTimelines.push(timeline);
        });
    }

    // Stop idle animation
    stopIdleAnimation() {
        if (this.idleTimelines && this.idleTimelines.length) {
            this.idleTimelines.forEach(tl => tl.kill());
        }
        this.idleTimelines = [];
    }

    // Spin animation with precise landing
    async spinReels(targetPrize, prizes, slotIcons) {
        if (this.isSpinning) return;
        this.isSpinning = true;

        // Stop idle animation before spinning
        this.stopIdleAnimation();

        // Play spin sound
        if (window.soundManager) {
            window.soundManager.onSpinStart();
        }

        const reels = Array.from(document.querySelectorAll('.reel .reel-strip'));
        const spinButton = document.getElementById('spinButton');

        // Disable spin button
        spinButton.disabled = true;
        spinButton.querySelector('.button-text').textContent = 'SPINNING...';

        // Dynamically calculate reelHeight if not set
        if (!this.reelHeight) {
            // Create a temp item to measure
            const tempItem = this.createReelItem(prizes[0]);
            document.body.appendChild(tempItem);
            this.reelHeight = tempItem.offsetHeight;
            document.body.removeChild(tempItem);
        }

        // For each reel, populate with random icons for suspense, then land on the result icon
        // Ensure enough icons to fill the reel and always center the winning icon
        const cycles = 30; // More cycles for extra buffer
        const bufferBelow = 10; // More buffer below
        reels.forEach((reel, i) => {
            reel.innerHTML = '';
            // Fill with suspenseful random icons above
            for (let c = 0; c < cycles; c++) {
                const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
                reel.appendChild(this.createReelItem(randomPrize));
            }
            // Add the winning icon in the center position
            reel.appendChild(this.createReelItem(slotIcons[i]));
            // Fill with suspenseful random icons below
            for (let extra = 0; extra < bufferBelow; extra++) {
                const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
                reel.appendChild(this.createReelItem(randomPrize));
            }
            // Center the winning icon
            const visibleCount = Math.floor(reel.parentNode.offsetHeight / this.reelHeight);
            // Adjust centerOffset to align with winning box position 
            // Winning box is at 50% + 7px, and reel-item height is now 180px
            const centerOffset = this.reelHeight * Math.floor(visibleCount / 2) - 30;
            gsap.set(reel, { y: -(cycles * this.reelHeight - centerOffset) });
        });

        // Calculate target positions for each slot icon
        const targetPositions = reels.map((reel, i) => {
            // The final index is cycles (for the selected icon at the end)
            const finalIndex = cycles;
            const visibleCount = Math.floor(reel.parentNode.offsetHeight / this.reelHeight);
            // Adjust centerOffset to align with winning box position
            // Winning box is at 50% + 7px, and reel-item height is now 180px
            const centerOffset = this.reelHeight * Math.floor(visibleCount / 2) - 30;
            return -(finalIndex * this.reelHeight - centerOffset);
        });

        // Seamless slot machine spin: all reels spin in a loop, then each stops in turn
        const settings = this.getAnimationSettings();
        const spinSpeed = settings.spinDuration;
        const spinCycles = this.performanceMode === 'performance' ? 10 : 15; // Fewer cycles in performance mode
        const staggerDelay = this.performanceMode === 'performance' ? 1.0 : 1.5; // Faster stagger in performance mode
        const itemsToSpin = this.reelHeight * (this.performanceMode === 'performance' ? 6 : 10); // Less movement in performance mode
        const reelLoops = [];
        const reelPromises = reels.map((reel, i) => {
            return new Promise(resolve => {
                const loopTimeline = gsap.timeline({ repeat: -1 });
                reelLoops[i] = loopTimeline;
                loopTimeline.to(reel, {
                    y: `-=${itemsToSpin}`,
                    duration: spinSpeed,
                    ease: settings.spinEase
                });
                setTimeout(() => {
                    loopTimeline.kill();
                    gsap.to(reel, {
                        y: targetPositions[i],
                        duration: settings.stopDuration,
                        ease: settings.stopEase,
                        onComplete: () => {
                            // Play reel stop sound
                            if (window.soundManager) {
                                window.soundManager.onReelStop();
                            }
                            resolve();
                        }
                    });
                }, i * staggerDelay * 1000 + spinCycles * spinSpeed * 1000);
            });
        });

        for (let i = 0; i < reelPromises.length; i++) {
            await reelPromises[i];
        }

        // Show prize popup after animation
        setTimeout(() => {
            this.showPrizePopup(targetPrize);
        }, 100); // Reduced delay from 500ms to 100ms

        // Re-enable spin button
        spinButton.disabled = false;
        spinButton.querySelector('.button-text').textContent = 'SPIN!';
        this.isSpinning = false;

        // After popup is closed, repopulate reels with all prize icons and resume idle animation
        document.getElementById('closePopup').addEventListener('click', () => {
            setTimeout(() => {
                this.populateReels(prizes);
            }, 400);
        }, { once: true });
    }

    // Calculate where each reel should stop to show the target prize
    calculateTargetPositions(targetPrize, prizes) {
        const positions = [];
        const itemsPerCycle = prizes.length;
        
        for (let i = 0; i < 3; i++) {
            // Find the target prize index within one cycle
            let targetIndex = prizes.findIndex(p => p.id === targetPrize.id);
            if (targetIndex === -1) targetIndex = 0;
            
            // Calculate position to center the prize in the visible area
            // We want to land in the middle cycle (around cycle 7-8) for smooth animation
            const targetCycle = 7 + Math.floor(Math.random() * 2); // Cycle 7 or 8
            const finalIndex = targetCycle * itemsPerCycle + targetIndex;
            
            // Position to center the item in the middle of the visible reel (position 1 of 3 visible)
            const centerOffset = this.reelHeight; // Center position
            const targetY = -(finalIndex * this.reelHeight - centerOffset);
            
            positions.push(targetY);
        }
        
        return positions;
    }

    // Animate individual reel
    animateReel(reel, targetY, duration) {
        return new Promise((resolve) => {
            // Create a smooth deceleration animation
            const timeline = gsap.timeline();
            
            // Fast initial spin
            timeline.to(reel, {
                y: targetY - (this.reelHeight * 10), // Overshoot by 10 items
                duration: duration * 0.7,
                ease: "power2.in"
            });
            
            // Slow deceleration to final position
            timeline.to(reel, {
                y: targetY,
                duration: duration * 0.3,
                ease: "power3.out",
                onComplete: () => {
                    resolve();
                }
            });
        });
    }

    // Show prize won popup with celebration
    showPrizePopup(prize) {
        const popup = document.getElementById('prizePopup');
        const prizeImage = document.getElementById('wonPrizeImage');
        const prizeName = document.getElementById('wonPrizeName');
        const prizeTitle = document.getElementById('prizePopupTitle');
        const prizeShield = popup.querySelector('.prize-shield');

        // Pre-load image to prevent lag during animation
        const img = new Image();
        img.onload = () => {
            prizeImage.src = prize.image;
        };
        img.src = prize.image;

        prizeName.textContent = prize.name;

        // Force hardware acceleration before animation (moved up for both types)
        gsap.set(popup, { force3D: true });
        gsap.set(popup.querySelector('.popup-content'), { force3D: true });

        // If prize is default, show 'Better luck next time' and sad cat image, else 'Congratulations' and trophy
        if (prize.isDefault) {
            if (prizeTitle) prizeTitle.textContent = 'Better luck next time!';
            if (prizeShield) {
                prizeShield.innerHTML = `<img src="/assets/images/Sad_cat.png" alt="Sad Cat" style="width: 120px; height: 120px; object-fit: contain; border-radius: 12px;" onerror="this.src='/slot-machine-app/assets/images/Sad_cat.png'">`;
            }
            
            // Play custom miaw sound with slight delay to not interfere with animation
            setTimeout(() => {
                if (window.soundManager) {
                    window.soundManager.onPopupLose();
                }
            }, 100);
        } else {
            if (prizeTitle) prizeTitle.textContent = 'Congratulations!';
            if (prizeShield) {
                prizeShield.innerHTML = `<img src="/assets/images/cat_win.png" alt="Winner Cat" style="width: 120px; height: 120px; object-fit: contain; border-radius: 12px;" onerror="this.src='/slot-machine-app/assets/images/cat_win.png'">`;
            }
            
            // Play custom congratulations sound with slight delay to not interfere with animation
            setTimeout(() => {
                if (window.soundManager) {
                    window.soundManager.onPopupWin();
                }
            }, 100);
        }

        popup.classList.remove('hidden');

        // Get performance-optimized animation settings
        const settings = this.getAnimationSettings();

        // Optimized popup entrance animation
        if (settings.popupScale) {
            // High quality mode - full scale animation with bounce
            gsap.fromTo(popup.querySelector('.popup-content'), 
                { 
                    scale: 0, 
                    rotation: prize.isDefault ? 10 : -10, // Slight variation for lose vs win
                    opacity: 0
                },
                { 
                    scale: 1, 
                    rotation: 0, 
                    opacity: 1,
                    duration: settings.popupDuration,
                    ease: settings.popupEase,
                    force3D: true,
                    onComplete: () => {
                        // Add a subtle pulse effect for "better luck next time"
                        if (prize.isDefault && this.performanceMode === 'high-quality') {
                            gsap.to(popup.querySelector('.popup-content'), {
                                scale: 1.02,
                                duration: 0.3,
                                ease: "power2.inOut",
                                yoyo: true,
                                repeat: 1,
                                force3D: true
                            });
                        }
                    }
                }
            );
        } else {
            // Performance mode - simple fade in
            gsap.fromTo(popup.querySelector('.popup-content'), 
                { opacity: 0 },
                { 
                    opacity: 1,
                    duration: settings.popupDuration,
                    ease: settings.popupEase,
                    force3D: true
                }
            );
        }

        // Trigger confetti only if not default prize and confetti is enabled
        if (!prize.isDefault && settings.enableConfetti) {
            console.log(`🎊 Triggering confetti - Mode: ${this.performanceMode}, EnableConfetti: ${settings.enableConfetti}`);
            // Delay confetti slightly to not interfere with popup animation
            setTimeout(() => {
                this.triggerConfetti();
            }, 200);
        } else {
            console.log(`🚫 Confetti skipped - Default prize: ${prize.isDefault}, Mode: ${this.performanceMode}, EnableConfetti: ${settings.enableConfetti}`);
        }
    }

    // Confetti celebration with performance-aware settings
    triggerConfetti() {
        const settings = this.getAnimationSettings();
        console.log(`🎊 triggerConfetti() called - Mode: ${this.performanceMode}, EnableConfetti: ${settings.enableConfetti}`);
        
        const duration = settings.enableConfetti ? 1500 : 0; // Slightly longer for better visibility
        const animationEnd = Date.now() + duration;
        const defaults = { 
            startVelocity: 25, 
            spread: 270, // Narrower spread for better visibility
            ticks: settings.enableConfetti ? 80 : 0, // Reduced ticks for performance
            zIndex: 10000, // Very high z-index to appear on top of modal
            particleCount: settings.confettiAmount || 4,
            colors: ['#FFD700', '#FF6347', '#32CD32', '#FF69B4', '#00CED1'] // Brighter colors for visibility
        };        if (!settings.enableConfetti) {
            console.log('⚡ Confetti disabled in performance mode - RETURNING EARLY');
            return; // Skip confetti entirely when disabled
        }

        console.log('🎊 Confetti enabled - proceeding with animation');

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = settings.confettiAmount * (timeLeft / duration);
            const multiplier = settings.confettiMultiplier || 1;

            // Performance-aware confetti bursts - from modal edges
            confetti(Object.assign({}, defaults, {
                particleCount: particleCount * multiplier,
                origin: { x: 0.35, y: 0.35 } // Top-left edge of modal
            }));
            confetti(Object.assign({}, defaults, {
                particleCount: particleCount * multiplier,
                origin: { x: 0.65, y: 0.35 } // Top-right edge of modal
            }));
            
            // Additional bursts from bottom edges
            confetti(Object.assign({}, defaults, {
                particleCount: particleCount,
                origin: { x: 0.35, y: 0.55 } // Bottom-left edge of modal
            }));
            confetti(Object.assign({}, defaults, {
                particleCount: particleCount,
                origin: { x: 0.65, y: 0.55 } // Bottom-right edge of modal
            }));
        }, settings.confettiInterval || 150); // Use performance-aware interval
    }

    // Close popup animation
    closePrizePopup() {
        const popup = document.getElementById('prizePopup');
        
        // Stop any playing custom sounds when closing popup
        if (window.soundManager) {
            window.soundManager.stopCustomSounds();
        }
        
        // Force hardware acceleration
        gsap.set(popup.querySelector('.popup-content'), { force3D: true });
        
        gsap.to(popup.querySelector('.popup-content'), {
            scale: 0,
            rotation: 10,
            opacity: 0,
            duration: 0.25, // Faster close animation
            ease: "back.in(1.4)", // Less bounce
            force3D: true, // GPU acceleration
            onComplete: () => {
                popup.classList.add('hidden');
                
                // Update prize display to reflect any quantity changes (like exhausted prizes)
                if (window.slotMachine && window.slotMachine.updatePrizeDisplay) {
                    window.slotMachine.updatePrizeDisplay();
                }
            }
        });
    }

    // Animate prize showcase
    animatePrizeShowcase() {
        const prizes = document.querySelectorAll('.prize-item');
        
        gsap.fromTo(prizes, 
            { y: -50, opacity: 0 },
            { 
                y: 0, 
                opacity: 1, 
                duration: 0.6, 
                stagger: 0.1,
                ease: "back.out(1.7)"
            }
        );
    }

    // Button hover effects
    initializeButtonEffects() {
        const spinButton = document.getElementById('spinButton');
        
        spinButton.addEventListener('mouseenter', () => {
            if (!spinButton.disabled) {
                gsap.to(spinButton, { scale: 1.05, duration: 0.2 });
            }
        });
        
        spinButton.addEventListener('mouseleave', () => {
            if (!spinButton.disabled) {
                gsap.to(spinButton, { scale: 1, duration: 0.2 });
            }
        });
    }
}

// Global animation manager instance
window.animationManager = new AnimationManager();