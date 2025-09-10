// Storage manager for the slot machine app
import { PRIZE_ASSETS } from './assets/assets.js';

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
                    name: "Grand Prize", // Cambridge Shield
                    image: PRIZE_ASSETS[0].path,
                    quantity: 50,
                    chance: 1
                },
                {
                    id: 2,
                    name: "2nd Prize", // Development EVP Shield
                    image: PRIZE_ASSETS[1].path,
                    quantity: 10,
                    chance: 2
                },
                {
                    id: 3,
                    name: "3rd Prize", // Inclusion EVP Shield
                    image: PRIZE_ASSETS[2].path,
                    quantity: 5,
                    chance: 3
                },
                 {
                    id: 4,
                    name: "Consolation", // Inclusion EVP Shield
                    image: PRIZE_ASSETS[4].path,
                    quantity: 5,
                    chance: 94
                }
            ];
            this.setPrizes(defaultPrizes);
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
        localStorage.removeItem('spinLogs');
        this.initializeDefaults();
    }

}

// Global storage instance
window.storageManager = new StorageManager();