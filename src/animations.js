// Animation manager using GSAP
class AnimationManager {
    constructor() {
        this.isSpinning = false;
        this.reelHeight = null; // Will be set dynamically
        this.idleTimelines = [];
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
            <img src="${prize.image}" alt="${prize.name}" onerror="this.src='https://static.vecteezy.com/system/resources/previews/019/040/585/non_2x/an-8-bit-retro-styled-pixel-art-illustration-of-chocolate-free-png.png'">
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
            // Winning box is at 50% + 20px, and reel-item height is 154px
            const centerOffset = this.reelHeight * Math.floor(visibleCount / 2) - 30;
            gsap.set(reel, { y: -(cycles * this.reelHeight - centerOffset) });
        });

        // Calculate target positions for each slot icon
        const targetPositions = reels.map((reel, i) => {
            // The final index is cycles (for the selected icon at the end)
            const finalIndex = cycles;
            const visibleCount = Math.floor(reel.parentNode.offsetHeight / this.reelHeight);
            // Adjust centerOffset to align with winning box position
            // Winning box is at 50% + 20px, and reel-item height is 154px
            const centerOffset = this.reelHeight * Math.floor(visibleCount / 2) - 30;
            return -(finalIndex * this.reelHeight - centerOffset);
        });

        // Seamless slot machine spin: all reels spin in a loop, then each stops in turn
        const spinSpeed = 0.15;
        const spinCycles = 15;
        const staggerDelay = 1.5;
        const itemsToSpin = this.reelHeight * 10;
        const reelLoops = [];
        const reelPromises = reels.map((reel, i) => {
            return new Promise(resolve => {
                const loopTimeline = gsap.timeline({ repeat: -1 });
                reelLoops[i] = loopTimeline;
                loopTimeline.to(reel, {
                    y: `-=${itemsToSpin}`,
                    duration: spinSpeed,
                    ease: "none"
                });
                setTimeout(() => {
                    loopTimeline.kill();
                    gsap.to(reel, {
                        y: targetPositions[i],
                        duration: 1.2,
                        ease: "power3.out",
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
                // Replace emoji with sad cat image using same pattern as prize images
                prizeShield.innerHTML = `<img src="./assets/images/Sad_cat.png" alt="Sad Cat" style="width: 120px; height: 120px; object-fit: contain; border-radius: 12px;" onerror="this.src='https://static.vecteezy.com/system/resources/previews/019/040/585/non_2x/an-8-bit-retro-styled-pixel-art-illustration-of-chocolate-free-png.png'">`;
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
                // Replace trophy emoji with cat_win image
                prizeShield.innerHTML = `<img src="./assets/images/cat_win.png" alt="Winner Cat" style="width: 120px; height: 120px; object-fit: contain; border-radius: 12px;" onerror="this.textContent='🏆'">`;
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

        // Trigger confetti only if not default prize
        if (!prize.isDefault) {
            // Delay confetti slightly to not interfere with popup animation
            setTimeout(() => {
                this.triggerConfetti();
            }, 200);
        }
    }

    // Confetti celebration
    triggerConfetti() {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { 
            startVelocity: 30, 
            spread: 360, 
            ticks: 60, 
            zIndex: 1001 // Higher than popup background (1000) but lower than popup content
        };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            }));
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            }));
        }, 250);
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