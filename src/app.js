// Main slot machine application
class SlotMachine {
    constructor() {
        this.initialize();
        this.setupEventListeners();
    }

    initialize() {
        this.updatePrizeDisplay();
        this.updateGameInfo();
        this.populateReels();
        this.initializeAnimations();
    }

    setupEventListeners() {
        // Spin button
        document.getElementById('spinButton').addEventListener('click', () => {
            this.spin();
        });

        // Close prize popup
        document.getElementById('closePopup').addEventListener('click', () => {
            animationManager.closePrizePopup();
        });

        // Toggle winning box visibility
        document.getElementById('toggleWinningBox').addEventListener('click', () => {
            this.toggleWinningBox();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.spin();
            }
        });
    }

    updatePrizeDisplay() {
        const prizeList = document.getElementById('prizeList');
        const prizes = storageManager.getPrizes();
        
        prizeList.innerHTML = '';
        
        prizes.forEach(prize => {
            const prizeItem = document.createElement('div');
            prizeItem.className = 'prize-item';
            prizeItem.innerHTML = `
                <img src="${prize.image}" alt="${prize.name}" onerror="this.src='https://static.vecteezy.com/system/resources/previews/019/040/585/non_2x/an-8-bit-retro-styled-pixel-art-illustration-of-chocolate-free-png.png'">
                <span>${prize.name}</span>
            `;
            prizeList.appendChild(prizeItem);
        });

        // Animate prize showcase
        setTimeout(() => {
            animationManager.animatePrizeShowcase();
        }, 100);
    }

    updateGameInfo() {
        const gameMode = storageManager.getGameMode();
        const modeDisplay = document.getElementById('modeDisplay');
        const remainingSpins = document.getElementById('remainingSpins');
        
        modeDisplay.textContent = `Mode: ${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}`;
        
        if (gameMode === 'duration') {
            const deck = storageManager.getDeck();
            remainingSpins.textContent = `Prizes remaining: ${deck.length}`;
            remainingSpins.style.display = 'block';
        } else {
            remainingSpins.style.display = 'none';
        }
    }

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

        // Update game info
        this.updateGameInfo();

    // Start the spin animation with slotIcons, show actualPrize in popup
    animationManager.spinReels(actualPrize, prizes, slotIcons);
    }

    determineWinningPrize(prizes) {
        const gameMode = storageManager.getGameMode();
        
        if (gameMode === 'duration') {
            return this.selectPrizeFromDeck(prizes);
        } else {
            return this.selectPrizeByProbability(prizes);
        }
    }

    selectPrizeFromDeck(prizes) {
        const deck = storageManager.getDeck();
        
        // Generate new deck if empty
        if (deck.length === 0) {
            const newDeck = storageManager.generateDeck();
            if (newDeck.length === 0) {
                return null; // No prizes with quantity > 0
            }
        }

        const winningStagePrizeId = storageManager.drawFromDeck();
        return prizes.find(p => p.id === winningStagePrizeId);
    }

    selectPrizeByProbability(prizes) {
        // Filter prizes with quantity > 0 (in probability mode, this means they're still available)
        const availablePrizes = prizes.filter(p => p.quantity > 0);
        if (availablePrizes.length === 0) {
            return null;
        }

        // Calculate total chance
        const totalChance = availablePrizes.reduce((sum, prize) => sum + prize.chance, 0);

        if (totalChance === 0) {
            // If no chances set, select randomly
            return availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
        }

        // Restore debug output to console
        console.log('Spin chances:', availablePrizes.map(p => ({ name: p.name, chance: p.chance, quantity: p.quantity })));
        let random = Math.random() * totalChance;
        console.log('Random value for spin:', random, 'Total chance:', totalChance);

        let selectedPrize = null;
        for (const prize of availablePrizes) {
            random -= prize.chance;
            if (random <= 0 && !selectedPrize) {
                // Decrease quantity in probability mode
                if (prize.quantity > 0) {
                    const updatedPrize = { ...prize, quantity: prize.quantity - 1 };
                    storageManager.updatePrize(updatedPrize);
                }
                console.log('Selected prize:', prize.name);
                selectedPrize = prize;
                break;
            }
        }
        if (!selectedPrize) {
            console.log('Fallback prize:', availablePrizes[availablePrizes.length - 1].name);
            selectedPrize = availablePrizes[availablePrizes.length - 1];
        }
        return selectedPrize;
    }

    toggleWinningBox() {
        const winningBox = document.getElementById('winningBox');
        const toggleText = document.getElementById('toggleText');
        if (winningBox.classList.contains('hidden')) {
            winningBox.classList.remove('hidden');
            toggleText.textContent = 'Hide Winning Box';
        } else {
            winningBox.classList.add('hidden');
            toggleText.textContent = 'Show Winning Box';
        }
    }

    logSpin(winningPrize) {
        const gameMode = storageManager.getGameMode();
        const logEntry = {
            prizeName: winningPrize.name,
            gameMode: gameMode
        };
        if (gameMode === 'duration') {
            logEntry.remainingInDeck = storageManager.getDeck().length;
        }
        storageManager.addLog(logEntry);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.slotMachine = new SlotMachine();
});