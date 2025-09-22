// webOS-Optimized Animation manager using GSAP with performance controls
class AnimationManager {
    constructor() {
        this.isSpinning = false;
        this.reelHeight = null;
        this.idleTimelines = [];
        
        // webOS performance controls
        this.maxConcurrentAnimations = 3;
        this.activeAnimations = new Set();
        this.performanceMode = this.detectWebOS();
        
        // Initialize GSAP with webOS optimizations
        this.initializeGSAPOptimizations();
    }

    // Detect if running on webOS Smart TV
    detectWebOS() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isWebOS = userAgent.includes('webos') || 
                       userAgent.includes('netcast') || 
                       userAgent.includes('smart-tv') ||
                       userAgent.includes('smarttv');
        
        if (isWebOS) {
            console.log('📺 webOS Smart TV detected - enabling performance mode');
        }
        
        return isWebOS;
    }

    // Initialize GSAP with webOS-specific optimizations
    initializeGSAPOptimizations() {
        if (typeof gsap !== 'undefined') {
            // Configure GSAP for webOS performance
            gsap.config({
                force3D: true,
                nullTargetWarn: false,
                trialWarn: false
            });

            // Set global defaults optimized for Smart TV
            gsap.defaults({
                ease: "power1.out", // Simpler easing for better performance
                force3D: true,
                lazy: false // Disable lazy rendering for predictable performance
            });

            // Register performance ticker for monitoring
            if (this.performanceMode) {
                gsap.ticker.fps(30); // Limit to 30fps for webOS stability
                this.setupPerformanceMonitoring();
            }

            console.log('⚡ GSAP optimized for webOS Smart TV performance');
        }
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        let frameCount = 0;
        let lastTime = performance.now();
        
        gsap.ticker.add(() => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round(frameCount);
                
                if (fps < 20 && this.activeAnimations.size > 0) {
                    console.warn(`⚠️ webOS Performance: ${fps} FPS - reducing animation complexity`);
                    this.reduceAnimationComplexity();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
        });
    }

    // Reduce animation complexity when performance drops
    reduceAnimationComplexity() {
        // Kill non-essential animations
        if (this.activeAnimations.size > this.maxConcurrentAnimations) {
            console.log('🎛️ Reducing animation complexity for webOS performance');
            
            // Keep only the most important animations
            const animationsArray = Array.from(this.activeAnimations);
            const toKill = animationsArray.slice(this.maxConcurrentAnimations);
            
            toKill.forEach(animation => {
                if (animation.kill) {
                    animation.kill();
                }
                this.activeAnimations.delete(animation);
            });
        }
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
        
        // Add a stable background to prevent white flashing
        item.style.backgroundColor = '#f0f0f0';
        item.style.minHeight = '180px'; // Ensure consistent height
        
        // Use optimized image creation for webOS performance
        let img;
        if (window.assetPreloader && window.assetPreloader.createOptimizedImage) {
            // Create webOS-optimized image element
            img = window.assetPreloader.createOptimizedImage(prize.image, 200, 200);
            img.style.opacity = '1';
            img.style.backgroundColor = 'transparent';
        } else {
            // Fallback: Try to get preloaded image to prevent white flashing
            const preloadedImg = window.assetPreloader ? window.assetPreloader.getPreloadedImage(prize.image) : null;
            
            img = document.createElement('img');
            if (preloadedImg) {
                // Use preloaded image data for instant display
                img.src = preloadedImg.src;
                img.style.opacity = '1';
                img.style.backgroundColor = 'transparent';
            } else {
                // Fallback to regular loading with stable background
                img.src = prize.image;
                img.style.backgroundColor = '#f0f0f0'; // Match item background
                img.style.opacity = '0.9'; // Slightly transparent until loaded
            }
        }
        
        img.alt = prize.name;
        img.loading = 'eager'; // Prioritize loading for better performance
        img.style.transition = 'opacity 0.1s ease'; // Faster transition
        
        // webOS-specific optimizations for smooth animation
        img.style.willChange = 'transform';
        img.style.transform = 'translateZ(0)';
        img.style.backfaceVisibility = 'hidden';
        img.style.imageRendering = 'auto';
        
        // Prevent layout shifts during spinning
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.display = 'block';
        
        // Handle load and error states for non-optimized images
        if (!window.assetPreloader || !window.assetPreloader.createOptimizedImage) {
            img.onload = () => {
                img.style.opacity = '1';
                img.style.backgroundColor = 'transparent';
            };
        }
        
        img.onerror = () => {
            img.src = '/assets/images/Sad_cat.png';
            img.style.backgroundColor = 'transparent';
            img.style.opacity = '1';
        };
        
        item.appendChild(img);
        
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
        const durations = [4, 5, 6]; // Faster durations optimized for webOS TV performance
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

    // Spin animation with precise landing and anti-flickering optimization
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
        const reelContainers = Array.from(document.querySelectorAll('.reel'));
        const spinButton = document.getElementById('spinButton');

        // Add spinning classes for optimized rendering during animation
        reelContainers.forEach(reel => {
            reel.classList.add('reel-spinning');
        });

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
        // Optimized for webOS performance - fewer cycles and less complexity
        const cycles = 15; // Reduced cycles for better performance on TV browsers
        const bufferBelow = 5; // Reduced buffer for faster rendering
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

        // Enhanced webOS spinning animation optimizations
        const spinSpeed = 0.12; // Slightly faster for smoother appearance
        const spinCycles = 12; // Reduced cycles for better performance
        const staggerDelay = 1.2; // Faster stagger
        const itemsToSpin = this.reelHeight * 8; // Reduced items to spin
        const reelLoops = [];
        
        // Force maximum GPU acceleration on all reels to prevent flickering
        reels.forEach(reel => {
            gsap.set(reel, { 
                force3D: true,
                transformPerspective: 1000,
                backfaceVisibility: "hidden",
                // Additional webOS optimizations
                rotationX: 0.01, // Force 3D context
                rotationY: 0.01,
                z: 0.01
            });
        });
        
        // webOS-Optimized spinning with reduced GSAP overhead
        const reelPromises = reels.map((reel, i) => {
            return new Promise(resolve => {
                // Track animation for performance monitoring
                const animationId = `reel-${i}-${Date.now()}`;
                
                let loopAnimation;
                
                if (this.performanceMode) {
                    // Use simpler CSS-based loop for webOS
                    reel.style.transition = 'none';
                    reel.style.transform = `translateY(${gsap.getProperty(reel, 'y')}px) translateZ(0)`;
                    
                    const startY = gsap.getProperty(reel, 'y');
                    const spinDistance = itemsToSpin;
                    let currentY = startY;
                    
                    const spinLoop = () => {
                        currentY -= spinDistance;
                        reel.style.transform = `translateY(${currentY}px) translateZ(0)`;
                        
                        if (performance.now() < spinEndTime) {
                            requestAnimationFrame(spinLoop);
                        }
                    };
                    
                    const spinEndTime = performance.now() + (i * staggerDelay * 1000 + spinCycles * spinSpeed * 1000);
                    requestAnimationFrame(spinLoop);
                    
                    setTimeout(() => {
                        // Final position with GSAP for precision
                        const finalTween = gsap.to(reel, {
                            y: targetPositions[i],
                            duration: 0.5, // Faster for webOS
                            ease: "power1.out",
                            force3D: true,
                            onComplete: () => {
                                this.activeAnimations.delete(animationId);
                                if (window.soundManager) {
                                    window.soundManager.onReelStop();
                                }
                                resolve();
                            }
                        });
                        
                        this.activeAnimations.add(finalTween);
                    }, spinEndTime - performance.now());
                    
                } else {
                    // Full GSAP animation for non-webOS
                    const loopTimeline = gsap.timeline({ 
                        repeat: -1,
                        smoothChildTiming: true
                    });
                    
                    this.activeAnimations.add(loopTimeline);
                    loopAnimation = loopTimeline;
                    
                    loopTimeline.to(reel, {
                        y: `-=${itemsToSpin}`,
                        duration: spinSpeed,
                        ease: "none",
                        force3D: true,
                        transformPerspective: 1000,
                        rotationX: 0.01,
                        z: 0.01
                    });
                    
                    setTimeout(() => {
                        loopTimeline.kill();
                        this.activeAnimations.delete(loopTimeline);
                        
                        const finalTween = gsap.to(reel, {
                            y: targetPositions[i],
                            duration: 0.6,
                            ease: "power1.out",
                            force3D: true,
                            transformPerspective: 1000,
                            rotationX: 0.01,
                            z: 0.01,
                            onComplete: () => {
                                this.activeAnimations.delete(finalTween);
                                if (window.soundManager) {
                                    window.soundManager.onReelStop();
                                }
                                resolve();
                            }
                        });
                        
                        this.activeAnimations.add(finalTween);
                    }, i * staggerDelay * 1000 + spinCycles * spinSpeed * 1000);
                }
            });
        });

        for (let i = 0; i < reelPromises.length; i++) {
            await reelPromises[i];
        }

        // Remove spinning classes to restore visual effects
        reelContainers.forEach(reel => {
            reel.classList.remove('reel-spinning');
        });

        // Show prize popup after animation
        setTimeout(() => {
            this.showPrizePopup(targetPrize);
        }, 100); // Reduced delay from 500ms to 100ms

        // Re-enable spin button
        spinButton.disabled = false;
        spinButton.querySelector('.button-text').textContent = 'SPIN!';
        this.isSpinning = false;

        console.log('🎰 Spin complete - webOS optimized with anti-flickering');
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

        // Optimized popup entrance animation (same for both win/lose)
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
                duration: 0.4, // Same duration for both
                ease: "back.out(1.4)", // Same easing for both
                force3D: true, // Force GPU acceleration
                onComplete: () => {
                    // Add a subtle pulse effect for "better luck next time" to match visual impact
                    if (prize.isDefault) {
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

        // No confetti for webOS optimization - confetti causes performance issues on TV browsers
        console.log('🎰 Prize popup shown - confetti disabled for webOS performance');
    }

    // Close popup animation
    closePrizePopup() {
        const popup = document.getElementById('prizePopup');
        
        // Stop all playing sounds when closing popup
        if (window.soundManager && window.soundManager.stopAllSounds) {
            window.soundManager.stopAllSounds();
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
                
                // Repopulate reels after popup closes
                setTimeout(() => {
                    const prizes = window.storageManager ? window.storageManager.getPrizes() : [];
                    this.populateReels(prizes);
                }, 100);
            }
        });
        
        console.log('🎰 Prize popup closed - webOS optimized');
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