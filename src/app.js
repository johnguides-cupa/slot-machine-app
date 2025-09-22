// Main slot machine application
class SlotMachine {
    constructor() {
        // Performance optimization: Cache frequently used values
        this.cachedPrizes = null;
        this.cachedAvailablePrizes = null;
        this.cachedTotalChance = null;
        this.lastPrizeUpdate = 0;
        
        this.initialize();
        this.setupEventListeners();
    }

    initialize() {
        this.updatePrizeDisplay();
        //this.updateGameInfo();
        this.populateReels();
        this.initializeAnimations();
        
        // Start background ambience after a short delay
        setTimeout(() => {
            if (window.soundManager) {
                window.soundManager.onBackgroundStart();
            }
        }, 2000);
    }

    setupEventListeners() {
        // Performance optimization: Debounce spin button to prevent spam
        let spinCooldown = false;
        
        // Spin button
        document.getElementById('spinButton').addEventListener('click', () => {
            if (spinCooldown || animationManager.isSpinning) return;
            
            spinCooldown = true;
            setTimeout(() => spinCooldown = false, 300); // 300ms cooldown
            
            if (window.soundManager) {
                window.soundManager.onButtonClick();
            }
            this.spin();
        });

        // Close prize popup
        document.getElementById('closePopup').addEventListener('click', () => {
            if (window.soundManager) {
                window.soundManager.onButtonClick();
            }
            animationManager.closePrizePopup();
        });

        // Keyboard shortcuts with debouncing
        let keyboardCooldown = false;
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !keyboardCooldown && !animationManager.isSpinning) {
                e.preventDefault();
                keyboardCooldown = true;
                setTimeout(() => keyboardCooldown = false, 300);
                this.spin();
            }
        });
    }

    updatePrizeDisplay() {
        const prizeList = document.getElementById('prizeList');
        const prizes = storageManager.getPrizes();
        
        // Performance optimization: Only update if prizes changed
        const currentUpdate = Date.now();
        if (this.cachedPrizes && 
            JSON.stringify(this.cachedPrizes) === JSON.stringify(prizes) &&
            currentUpdate - this.lastPrizeUpdate < 100) {
            return; // Skip update if same data and updated recently
        }
        
        this.cachedPrizes = [...prizes]; // Create copy for comparison
        this.lastPrizeUpdate = currentUpdate;
        
        // Clear cache when prizes update
        this.clearPrizeCache();
        
        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        prizes.forEach(prize => {
            const prizeItem = document.createElement('div');
            prizeItem.className = 'prize-item';
            
            // Add out-of-stock class if quantity is 0
            if (prize.quantity === 0) {
                prizeItem.classList.add('out-of-stock');
            }
            
            prizeItem.innerHTML = `
                <img src="${prize.image}" alt="${prize.name}" onerror="this.src='/assets/images/Sad_cat.png'">
                <span>${prize.name}</span>
                ${prize.quantity === 0 ? '<div class="out-of-stock-overlay"><div class="x-mark">X</div></div>' : ''}
            `;
            fragment.appendChild(prizeItem);
        });
        
        // Single DOM update
        prizeList.innerHTML = '';
        prizeList.appendChild(fragment);

        // Animate prize showcase
        setTimeout(() => {
            animationManager.animatePrizeShowcase();
        }, 100);
    }

    // Performance optimization: Clear cached prize data
    clearPrizeCache() {
        this.cachedAvailablePrizes = null;
        this.cachedTotalChance = null;
    }

    // Performance optimization: Get available prizes with caching
    getAvailablePrizes(prizes) {
        if (!this.cachedAvailablePrizes) {
            this.cachedAvailablePrizes = prizes.filter(p => p.quantity > 0);
            this.cachedTotalChance = this.cachedAvailablePrizes.reduce((sum, prize) => sum + prize.chance, 0);
        }
        return {
            prizes: this.cachedAvailablePrizes,
            totalChance: this.cachedTotalChance
        };
    }

    // updateGameInfo() {
    //     // Simple display for probability mode
    //     const modeDisplay = document.getElementById('modeDisplay');
    //     modeDisplay.textContent = 'Probability Mode';
    // }

    populateReels() {
        const prizes = storageManager.getPrizes();
        animationManager.populateReels(prizes);
    }

    initializeAnimations() {
        animationManager.initializeButtonEffects();
    }

    spin() {
        if (animationManager.isSpinning) return;

        const prizes = storageManager.getPrizes();
        if (prizes.length === 0) {
            alert('No prizes available! Please add some prizes in the admin panel.');
            return;
        }

        // Determine winning prize based on game mode
        const winningPrize = this.determineWinningPrize(prizes);
        if (!winningPrize) {
            alert('No more prizes available!');
            return;
        }

        // Suspenseful slot icon logic for default prize
        let slotIcons = [];
        let actualPrize = winningPrize;
        const defaultPrize = prizes.reduce((max, p) => p.chance > max.chance ? p : max, prizes[0] || {chance:0});
        if (winningPrize.id === defaultPrize.id) {
            const available = prizes.filter(p => p.id !== defaultPrize.id);
            if (available.length === 0) {
                slotIcons = [defaultPrize, defaultPrize, defaultPrize];
            } else {
                // 50% chance slot 1 and 2 match, slot 3 always different
                const idx1 = Math.floor(Math.random() * available.length);
                let idx2 = Math.floor(Math.random() * available.length);
                let idx3 = Math.floor(Math.random() * available.length);
                if (Math.random() < 0.5) {
                    idx2 = idx1;
                } else {
                    // Ensure slot 2 is different from slot 1
                    while (idx2 === idx1 && available.length > 1) {
                        idx2 = Math.floor(Math.random() * available.length);
                    }
                }
                // Ensure slot 3 is different from slot 1 and 2
                while ((idx3 === idx1 || idx3 === idx2) && available.length > 1) {
                    idx3 = Math.floor(Math.random() * available.length);
                }
                slotIcons = [available[idx1], available[idx2], available[idx3]];
            }
            // If all icons match, set actualPrize to that icon; else, defaultPrize
            if (slotIcons[0].id === slotIcons[1].id && slotIcons[1].id === slotIcons[2].id) {
                actualPrize = slotIcons[0];
            } else {
                actualPrize = defaultPrize;
            }
        } else {
            slotIcons = [winningPrize, winningPrize, winningPrize];
            actualPrize = winningPrize;
        }
        // Mark if actualPrize is the default prize
        actualPrize = { ...actualPrize, isDefault: actualPrize.id === defaultPrize.id };

        // Log the spin (always use actualPrize)
        this.logSpin(actualPrize);
        
        // Clear cache after winning (quantities may have changed)
        this.clearPrizeCache();

        // Update game info
        //this.updateGameInfo();

    // Start the spin animation with slotIcons, show actualPrize in popup
    animationManager.spinReels(actualPrize, prizes, slotIcons);
    }

    determineWinningPrize(prizes) {
        return this.selectPrizeByProbability(prizes);
    }

    selectPrizeByProbability(prizes) {
        // Performance optimization: Use cached available prizes
        const { prizes: availablePrizes, totalChance } = this.getAvailablePrizes(prizes);
        
        if (availablePrizes.length === 0) {
            console.log('❌ No prizes available - all quantities exhausted!');
            return null;
        }

        if (totalChance === 0) {
            // If no chances set, select randomly from available
            return availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
        }

        // Generate random number between 0 and totalChance (cached)
        let random = Math.random() * totalChance;
        console.log('🎲 Spin - Available prizes:', availablePrizes.length, 'Total chance:', totalChance);
        console.log('   Random value:', random.toFixed(3));

        let selectedPrize = null;
        let cumulativeChance = 0;
        
        for (const prize of availablePrizes) {
            cumulativeChance += prize.chance;
            console.log(`  ${prize.name}: ${(cumulativeChance - prize.chance).toFixed(1)} - ${cumulativeChance.toFixed(1)} (${prize.chance}% of ${totalChance}) [Qty: ${prize.quantity}]`);
            
            if (random <= cumulativeChance && !selectedPrize) {
                selectedPrize = prize;
                console.log(`✅ Selected: ${prize.name}`);
                
                // Reduce quantity when prize is won
                const updatedPrize = { ...prize, quantity: prize.quantity - 1 };
                storageManager.updatePrize(updatedPrize);
                console.log(`📦 ${prize.name} quantity: ${prize.quantity} → ${updatedPrize.quantity}`);
                
                if (updatedPrize.quantity === 0) {
                    console.log(`🚫 ${prize.name} is now exhausted and will be removed from future spins!`);
                }
                break;
            }
        }
        
        // Fallback (should rarely happen)
        if (!selectedPrize) {
            selectedPrize = availablePrizes[availablePrizes.length - 1];
            console.log('⚠️ Fallback selected:', selectedPrize.name);
        }
        
        return selectedPrize;
    }

    // Updated test function to account for quantity depletion
    testProbabilityAccuracy(iterations = 100) {
        console.log(`\n🧪 Testing quantity-based probability system with ${iterations} iterations...`);
        
        const prizes = storageManager.getPrizes();
        const results = {};
        const originalQuantities = {};
        
        // Initialize counters and save original quantities
        prizes.forEach(prize => {
            results[prize.name] = 0;
            originalQuantities[prize.name] = prize.quantity;
        });
        
        console.log('\n📦 Starting quantities:');
        prizes.forEach(prize => {
            console.log(`  ${prize.name}: ${prize.quantity} (${prize.chance}%)`);
        });
        
        // Run test iterations
        for (let i = 0; i < iterations; i++) {
            const currentPrizes = storageManager.getPrizes();
            const availablePrizes = currentPrizes.filter(p => p.quantity > 0);
            
            if (availablePrizes.length === 0) {
                console.log(`\n🏁 All prizes exhausted after ${i} spins!`);
                break;
            }
            
            const winner = this.selectPrizeByProbability(currentPrizes);
            if (winner) {
                results[winner.name]++;
            }
        }
        
        // Calculate and display results
        console.log('\n📊 Final Results:');
        console.log('Prize\t\tWins\tOriginal Qty\tRemaining');
        console.log('─'.repeat(50));
        
        const finalPrizes = storageManager.getPrizes();
        Object.keys(results).forEach(prizeName => {
            const finalPrize = finalPrizes.find(p => p.name === prizeName);
            const wins = results[prizeName];
            const originalQty = originalQuantities[prizeName];
            const remaining = finalPrize ? finalPrize.quantity : 0;
            
            console.log(`${prizeName.padEnd(15)}\t${wins}\t${originalQty}\t\t${remaining}`);
        });
        
        console.log('\n✅ Test completed. Quantities should decrease as prizes are won.');
        console.log('💡 Reset the game to restore original quantities.');
    }

    logSpin(winningPrize) {
        const logEntry = {
            prizeName: winningPrize.name,
            gameMode: 'Probability'
        };
        storageManager.addLog(logEntry);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.slotMachine = new SlotMachine();
    
    // Add probability test function to global scope for easy testing
    window.testProbability = (iterations = 1000) => {
        window.slotMachine.testProbabilityAccuracy(iterations);
    };
    
    console.log('🎰 Slot Machine loaded! Test probability with: testProbability(1000)');
});