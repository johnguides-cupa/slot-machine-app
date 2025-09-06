// Storage manager for the slot machine app
class StorageManager {
    constructor() {
        this.initializeDefaults();
    }

    initializeDefaults() {
        // Initialize default prizes if none exist
        if (!this.getPrizes().length) {
            const defaultPrizes = [
                {
                    id: 1,
                    name: "Chocolate Bar",
                    image: "https://static.vecteezy.com/system/resources/previews/019/040/585/non_2x/an-8-bit-retro-styled-pixel-art-illustration-of-chocolate-free-png.png",
                    quantity: 50,
                    chance: 60
                },
                {
                    id: 2,
                    name: "Gift Card",
                    image: "https://static.vecteezy.com/system/resources/previews/027/879/811/non_2x/gift-card-in-pixel-art-style-vector.jpg",
                    quantity: 10,
                    chance: 25
                },
                {
                    id: 3,
                    name: "Premium Prize",
                    image: "https://static.vecteezy.com/system/resources/previews/052/100/288/non_2x/pixel-art-gift-game-asset-design-free-vector.jpg",
                    quantity: 5,
                    chance: 15
                }
            ];
            this.setPrizes(defaultPrizes);
        }

        // Initialize game settings
        if (!localStorage.getItem('gameMode')) {
            localStorage.setItem('gameMode', 'probability');
        }
    }

    // Prize management
    getPrizes() {
        const prizes = localStorage.getItem('prizes');
        return prizes ? JSON.parse(prizes) : [];
    }

    setPrizes(prizes) {
        localStorage.setItem('prizes', JSON.stringify(prizes));
    }

    addPrize(prize) {
        const prizes = this.getPrizes();
        prize.id = Date.now(); // Simple ID generation
        prizes.push(prize);
        this.setPrizes(prizes);
        return prize;
    }

    updatePrize(updatedPrize) {
        const prizes = this.getPrizes();
        const index = prizes.findIndex(p => p.id === updatedPrize.id);
        if (index !== -1) {
            prizes[index] = updatedPrize;
            this.setPrizes(prizes);
            return true;
        }
        return false;
    }

    deletePrize(prizeId) {
        const prizes = this.getPrizes();
        const filteredPrizes = prizes.filter(p => p.id !== prizeId);
        this.setPrizes(filteredPrizes);
        return filteredPrizes.length !== prizes.length;
    }

    // Game mode management
    getGameMode() {
        return localStorage.getItem('gameMode') || 'probability';
    }

    setGameMode(mode) {
        localStorage.setItem('gameMode', mode);
    }

    // Duration deck management (for duration mode)
    getDeck() {
        const deck = localStorage.getItem('deck');
        return deck ? JSON.parse(deck) : [];
    }

    setDeck(deck) {
        localStorage.setItem('deck', JSON.stringify(deck));
    }

    generateDeck() {
        const prizes = this.getPrizes();
        const deck = [];

        prizes.forEach(prize => {
            for (let i = 0; i < prize.quantity; i++) {
                deck.push(prize.id);
            }
        });

        // Shuffle the deck
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        this.setDeck(deck);
        return deck;
    }

    drawFromDeck() {
        const deck = this.getDeck();
        if (deck.length === 0) {
            this.generateDeck();
            return this.drawFromDeck();
        }

        const drawnPrizeId = deck.pop();
        this.setDeck(deck);
        return drawnPrizeId;
    }

    // Spin logs management
    getLogs() {
        const logs = localStorage.getItem('spinLogs');
        return logs ? JSON.parse(logs) : [];
    }

    addLog(logEntry) {
        const logs = this.getLogs();
        logEntry.timestamp = new Date().toISOString();
        logs.unshift(logEntry); // Add to beginning
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(100);
        }
        
        localStorage.setItem('spinLogs', JSON.stringify(logs));
    }

    clearLogs() {
        localStorage.removeItem('spinLogs');
    }

    // Reset all data
    resetAll() {
        localStorage.removeItem('prizes');
        localStorage.removeItem('deck');
        localStorage.removeItem('spinLogs');
        localStorage.removeItem('gameMode');
        this.initializeDefaults();
    }

    // Get remaining prizes count for duration mode
    getRemainingPrizesCount() {
        const deck = this.getDeck();
        const prizes = this.getPrizes();
        const counts = {};

        // Initialize counts
        prizes.forEach(prize => {
            counts[prize.id] = 0;
        });

        // Count remaining in deck
        deck.forEach(prizeId => {
            if (counts[prizeId] !== undefined) {
                counts[prizeId]++;
            }
        });

        return counts;
    }
}

// Global storage instance
window.storageManager = new StorageManager();