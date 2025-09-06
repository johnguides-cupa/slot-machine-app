// Admin panel functionality
class AdminPanel {
    constructor() {
        this.currentEditingPrize = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // Close admin panel
        document.getElementById('closeAdmin').addEventListener('click', () => {
            const prizes = storageManager.getPrizes();
            const totalChance = prizes.reduce((sum, p) => sum + p.chance, 0);
            if (totalChance !== 100) {
                alert('Total win chance must be exactly 100% before closing the admin panel.');
                return;
            }
            this.hide();
        });

        // Prize management
        document.getElementById('addPrize').addEventListener('click', () => {
            this.showPrizeEditor();
        });

        document.getElementById('savePrize').addEventListener('click', () => {
            this.savePrize();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.hidePrizeEditor();
        });

        // Game settings
        document.querySelectorAll('input[name="gameMode"]').forEach(radio => {
            radio.addEventListener('change', () => {
                storageManager.setGameMode(radio.value);
                this.updateGameModeDisplay();
            });
        });

        document.getElementById('resetGame').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the game and clear all logs?')) {
                this.resetGame();
            }
        });
    }

    show() {
        document.getElementById('adminPanel').classList.remove('hidden');
        this.refreshContent();
    }

    hide() {
        document.getElementById('adminPanel').classList.add('hidden');
        this.hidePrizeEditor();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Refresh content based on active tab
        switch(tabName) {
            case 'prizes':
                this.refreshPrizesList();
                break;
            case 'settings':
                this.refreshSettings();
                break;
            case 'logs':
                this.refreshLogs();
                break;
        }
    }

    refreshContent() {
        this.refreshPrizesList();
        this.refreshSettings();
        this.refreshLogs();
    }

    // Prize Management
    refreshPrizesList() {
        const container = document.getElementById('prizesList');
        const prizes = storageManager.getPrizes();
        
        container.innerHTML = '';
        
        prizes.forEach(prize => {
            const prizeCard = document.createElement('div');
            prizeCard.className = 'prize-card';
            prizeCard.innerHTML = `
                <img src="${prize.image}" alt="${prize.name}" onerror="this.src='https://static.vecteezy.com/system/resources/previews/019/040/585/non_2x/an-8-bit-retro-styled-pixel-art-illustration-of-chocolate-free-png.png'">
                <div class="prize-info">
                    <h4>${prize.name}</h4>
                    <p>Quantity: ${prize.quantity}</p>
                    <p>Win Chance: ${prize.chance}%</p>
                </div>
                <div class="prize-actions">
                    <button onclick="adminPanel.editPrize(${prize.id})">Edit</button>
                    <button class="delete" onclick="adminPanel.deletePrize(${prize.id})">Delete</button>
                </div>
            `;
            container.appendChild(prizeCard);
        });
    }

    showPrizeEditor(prize = null) {
        const editor = document.getElementById('prizeEditor');
        const title = document.getElementById('editorTitle');

        // Add labels to input fields if not present
        function ensureLabel(inputId, labelText) {
            const input = document.getElementById(inputId);
            if (input) {
                let label = document.getElementById(inputId + '-label');
                if (!label) {
                    label = document.createElement('label');
                    label.id = inputId + '-label';
                    label.htmlFor = inputId;
                    label.textContent = labelText;
                    label.style.display = 'block';
                    label.style.fontWeight = 'bold';
                    label.style.margin = '8px 0 2px 0';
                    input.parentNode.insertBefore(label, input);
                }
            }
        }
        ensureLabel('prizeName', 'Prize Name');
        ensureLabel('prizeImage', 'Prize Image URL');
        ensureLabel('prizeQuantity', 'Quantity');
        ensureLabel('prizeChance', 'Win Chance (%)');

        if (prize) {
            // Edit existing prize
            this.currentEditingPrize = prize;
            title.textContent = 'Edit Prize';
            document.getElementById('prizeName').value = prize.name;
            document.getElementById('prizeImage').value = prize.image;
            document.getElementById('prizeQuantity').value = prize.quantity;
            document.getElementById('prizeChance').value = prize.chance;
        } else {
            // Add new prize
            this.currentEditingPrize = null;
            title.textContent = 'Add New Prize';
            document.getElementById('prizeName').value = '';
            document.getElementById('prizeImage').value = '';
            document.getElementById('prizeQuantity').value = '';
            document.getElementById('prizeChance').value = '';
        }

        // Add or update live total chance message
        let msg = document.getElementById('chanceMessage');
        if (!msg) {
            msg = document.createElement('div');
            msg.id = 'chanceMessage';
            msg.style.margin = '10px 0';
            msg.style.fontWeight = 'bold';
            msg.style.color = '#e74c3c';
            editor.appendChild(msg);
        }
        this.updateChanceMessage();

        // Add live update for chance input
        document.getElementById('prizeChance').addEventListener('input', () => {
            this.updateChanceMessage();
        });

        // Show which prize is currently the default (highest percentage)
        const prizes = storageManager.getPrizes();
        const highestPrize = prizes.reduce((max, p) => p.chance > max.chance ? p : max, prizes[0] || {chance:0});
        let defaultLabel = document.getElementById('defaultPrizeLabel');
        if (!defaultLabel) {
            defaultLabel = document.createElement('div');
            defaultLabel.id = 'defaultPrizeLabel';
            defaultLabel.style.margin = '10px 0';
            defaultLabel.style.fontWeight = 'bold';
            defaultLabel.style.color = '#FFD700';
            defaultLabel.style.fontSize = '1.1em';
            editor.appendChild(defaultLabel);
        }
        defaultLabel.textContent = highestPrize ? `Default Prize: ${highestPrize.name} (${highestPrize.chance}%)` : '';

        editor.classList.remove('hidden');
    }

    updateChanceMessage() {
        const chanceInput = document.getElementById('prizeChance');
        const chance = parseFloat(chanceInput.value) || 0;
        const prizes = storageManager.getPrizes();
        let totalChance = 0;
        if (this.currentEditingPrize) {
            totalChance = prizes.reduce((sum, p) => sum + (p.id === this.currentEditingPrize.id ? chance : p.chance), 0);
        } else {
            totalChance = prizes.reduce((sum, p) => sum + p.chance, 0) + chance;
        }
        const msg = document.getElementById('chanceMessage');
        if (totalChance < 100) {
            msg.textContent = `Total win chance: ${totalChance}%. ${100 - totalChance}% left to allocate.`;
            msg.style.color = '#e67e22';
        } else if (totalChance > 100) {
            msg.textContent = `Total win chance: ${totalChance}%. Exceeded by ${totalChance - 100}%.`;
            msg.style.color = '#e74c3c';
        } else {
            msg.textContent = `Total win chance: 100%. Ready to save!`;
            msg.style.color = '#27ae60';
        }
    }

    hidePrizeEditor() {
        document.getElementById('prizeEditor').classList.add('hidden');
        this.currentEditingPrize = null;
    }

    savePrize() {
        const name = document.getElementById('prizeName').value.trim();
        const image = document.getElementById('prizeImage').value.trim();
        const quantity = parseInt(document.getElementById('prizeQuantity').value);
        const chance = parseFloat(document.getElementById('prizeChance').value);

        let msg = document.getElementById('chanceMessage');
        if (!name || !image || quantity < 0 || chance < 0 || chance > 100) {
            msg.textContent = 'Please fill all fields with valid values.';
            msg.style.color = '#e74c3c';
            return;
        }

        // Calculate total chance including this prize
        const prizes = storageManager.getPrizes();
        let totalChance = 0;
        if (this.currentEditingPrize) {
            totalChance = prizes.reduce((sum, p) => sum + (p.id === this.currentEditingPrize.id ? chance : p.chance), 0);
        } else {
            totalChance = prizes.reduce((sum, p) => sum + p.chance, 0) + chance;
        }

        if (totalChance > 100) {
            msg.textContent = `Cannot save: Exceeded by ${totalChance - 100}%. Total must be exactly 100%.`;
            msg.style.color = '#e74c3c';
            return;
        }

        // Allow saving/updating even if total is less than 100%
        if (totalChance < 100) {
            msg.textContent = `Saved. ${100 - totalChance}% left to allocate. You must reach 100% before finishing.`;
            msg.style.color = '#e67e22';
        } else {
            msg.textContent = 'Saved! Total win chance is 100%. Ready to go.';
            msg.style.color = '#27ae60';
        }

        const prizeData = {
            name,
            image,
            quantity,
            chance
        };

        if (this.currentEditingPrize) {
            // Update existing prize
            prizeData.id = this.currentEditingPrize.id;
            storageManager.updatePrize(prizeData);
        } else {
            // Add new prize
            storageManager.addPrize(prizeData);
        }

        // Only close editor if total is 100
        if (totalChance === 100) {
            this.hidePrizeEditor();
        }
        this.refreshPrizesList();

        // Update the main app display
        if (window.slotMachine) {
            window.slotMachine.updatePrizeDisplay();
        }
    }

    editPrize(prizeId) {
        const prizes = storageManager.getPrizes();
        const prize = prizes.find(p => p.id === prizeId);
        if (prize) {
            this.showPrizeEditor(prize);
        }
    }

    deletePrize(prizeId) {
        if (confirm('Are you sure you want to delete this prize?')) {
            storageManager.deletePrize(prizeId);
            this.refreshPrizesList();
            
            // Update the main app display
            if (window.slotMachine) {
                window.slotMachine.updatePrizeDisplay();
            }
        }
    }

    // Settings Management
    refreshSettings() {
        const gameMode = storageManager.getGameMode();
        document.querySelector(`input[value="${gameMode}"]`).checked = true;
    }

    updateGameModeDisplay() {
        if (window.slotMachine) {
            window.slotMachine.updateGameInfo();
        }
    }

    resetGame() {
        storageManager.resetAll();
        this.refreshContent();
        
        // Update the main app
        if (window.slotMachine) {
            window.slotMachine.initialize();
        }
        
        alert('Game has been reset successfully!');
    }

    // Logs Management
    refreshLogs() {
        const container = document.getElementById('spinLogs');
        const logs = storageManager.getLogs();
        
        container.innerHTML = '';
        
        if (logs.length === 0) {
            container.innerHTML = '<p>No spins recorded yet.</p>';
            return;
        }

        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            const date = new Date(log.timestamp).toLocaleString();
            logEntry.innerHTML = `
                <strong>${date}</strong><br>
                Prize: ${log.prizeName}<br>
                Mode: ${log.gameMode}
                ${log.gameMode === 'duration' ? `<br>Remaining in deck: ${log.remainingInDeck}` : ''}
            `;
            container.appendChild(logEntry);
        });
    }
}

// Admin access function
function showAdminLogin() {
    const password = prompt('Enter admin password:');
    if (password === 'admin123') { // Simple password - change as needed
        adminPanel.show();
    } else if (password !== null) {
        alert('Invalid password');
    }
}

// Global admin panel instance
window.adminPanel = new AdminPanel();