// Admin panel functionality
import { PRIZE_ASSETS, getAssetUrl } from './assets/assets.js';

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

        // Ensure prize name input accepts spaces
        document.addEventListener('DOMContentLoaded', () => {
            const prizeNameInput = document.getElementById('prizeName');
            if (prizeNameInput) {
                // Remove any restrictions that might prevent spaces
                prizeNameInput.removeAttribute('pattern');
                prizeNameInput.style.userSelect = 'text';
                prizeNameInput.style.pointerEvents = 'auto';
                
                // Ensure spacebar works
                prizeNameInput.addEventListener('keydown', (e) => {
                    // Allow spacebar (keyCode 32)
                    if (e.keyCode === 32) {
                        e.stopPropagation();
                    }
                });
            }
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
            if (window.soundManager) window.soundManager.onButtonClick();
            this.showPrizeEditor();
        });

        document.getElementById('savePrize').addEventListener('click', () => {
            if (window.soundManager) window.soundManager.onButtonClick();
            this.savePrize();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            if (window.soundManager) window.soundManager.onButtonClick();
            this.hidePrizeEditor();
        });

        document.getElementById('resetGame').addEventListener('click', () => {
            if (window.soundManager) window.soundManager.onButtonClick();
            if (confirm('Are you sure you want to reset the game and clear all logs?')) {
                this.resetGame();
            }
        });
    }

    show() {
        document.getElementById('adminPanel').classList.remove('hidden');
        this.refreshContent();
        
        // Ensure prize name input works correctly
        setTimeout(() => {
            const prizeNameInput = document.getElementById('prizeName');
            if (prizeNameInput) {
                prizeNameInput.removeAttribute('pattern');
                prizeNameInput.style.userSelect = 'text';
                prizeNameInput.style.pointerEvents = 'auto';
                
                // Test that spaces work
                prizeNameInput.addEventListener('keydown', (e) => {
                    if (e.keyCode === 32) {
                        e.stopPropagation();
                    }
                });
                
                console.log('Prize name input initialized for spaces');
            }
        }, 100);
    }

    hide() {
        document.getElementById('adminPanel').classList.add('hidden');
        this.hidePrizeEditor();
        // Refresh slot machine reels when admin panel closes
        this.refreshSlotMachine();
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

        // Create image source selector if it doesn't exist
        this.createImageSourceSelector();

        if (prize) {
            // Edit existing prize
            this.currentEditingPrize = prize;
            title.textContent = 'Edit Prize';
            document.getElementById('prizeName').value = prize.name;
            document.getElementById('prizeImage').value = prize.image || '';
            document.getElementById('prizeQuantity').value = prize.quantity;
            document.getElementById('prizeChance').value = prize.chance;
            
            // Set image source selector based on current image
            this.updateImageSourceSelector(prize.image);
        } else {
            // Add new prize
            this.currentEditingPrize = null;
            title.textContent = 'Add New Prize';
            document.getElementById('prizeName').value = '';
            document.getElementById('prizeImage').value = '';
            document.getElementById('prizeQuantity').value = '';
            document.getElementById('prizeChance').value = '';
            
            // Reset image source selector
            this.updateImageSourceSelector('');
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
            this.hideAutoAdjustWarning();
        } else if (totalChance > 100) {
            const excess = totalChance - 100;
            msg.textContent = `Total win chance: ${totalChance}%. Exceeded by ${excess}%.`;
            msg.style.color = '#e74c3c';
            this.showAutoAdjustWarning(excess);
        } else {
            msg.textContent = `Total win chance: 100%. Ready to save!`;
            msg.style.color = '#27ae60';
            this.hideAutoAdjustWarning();
        }
    }

    showAutoAdjustWarning(excessPercentage) {
        let warningDiv = document.getElementById('autoAdjustWarning');
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.id = 'autoAdjustWarning';
            warningDiv.style.cssText = `
                margin: 15px 0;
                padding: 15px;
                background-color: rgba(255, 193, 7, 0.1);
                border: 2px solid #ffc107;
                border-radius: 8px;
                color: #ff8f00;
                font-weight: bold;
                font-size: 0.95em;
            `;
            
            const editor = document.getElementById('prizeEditor');
            const chanceMessage = document.getElementById('chanceMessage');
            chanceMessage.parentNode.insertBefore(warningDiv, chanceMessage.nextSibling);
        }
        
        // Find the current highest percentage prize (excluding the one being edited)
        const prizes = storageManager.getPrizes();
        let highestPrize = null;
        let highestChance = 0;
        
        for (const prize of prizes) {
            if (this.currentEditingPrize && prize.id === this.currentEditingPrize.id) {
                continue; // Skip the prize being edited
            }
            if (prize.chance > highestChance) {
                highestChance = prize.chance;
                highestPrize = prize;
            }
        }
        
        if (highestPrize) {
            const newPercentage = Math.max(0.1, highestChance - excessPercentage);
            warningDiv.innerHTML = `
                <strong>⚠️ Auto-Adjustment Warning</strong><br>
                If you save with this percentage, the excess ${excessPercentage.toFixed(1)}% will be automatically removed from the highest percentage prize:<br>
                <strong>"${highestPrize.name}"</strong> will be reduced from ${highestChance}% to ${newPercentage.toFixed(1)}%
            `;
        } else {
            warningDiv.innerHTML = `
                <strong>⚠️ Auto-Adjustment Warning</strong><br>
                Total percentage exceeds 100%. The excess will be automatically adjusted when saving.
            `;
        }
        
        warningDiv.style.display = 'block';
    }

    hideAutoAdjustWarning() {
        const warningDiv = document.getElementById('autoAdjustWarning');
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
    }

    hidePrizeEditor() {
        document.getElementById('prizeEditor').classList.add('hidden');
        this.currentEditingPrize = null;
    }

    createImageSourceSelector() {
        // Check if the selector already exists
        if (document.getElementById('imageSourceSelector')) return;

        const prizeImageInput = document.getElementById('prizeImage');
        const container = prizeImageInput.parentNode;

        // Create image source selector
        const selectorContainer = document.createElement('div');
        selectorContainer.id = 'imageSourceSelector';
        selectorContainer.className = 'image-source-selector';

        // Create radio buttons for image source selection
        const sourceLabel = document.createElement('label');
        sourceLabel.textContent = 'Image Source';
        sourceLabel.style.display = 'block';
        sourceLabel.style.fontWeight = 'bold';
        sourceLabel.style.margin = '8px 0 5px 0';

        const urlOption = document.createElement('div');
        urlOption.className = 'image-source-option';
        urlOption.innerHTML = `
            <label>
                <input type="radio" name="imageSource" value="url" checked>
                <span>Use URL</span>
            </label>
        `;

        const assetOption = document.createElement('div');
        assetOption.className = 'image-source-option';
        assetOption.innerHTML = `
            <label>
                <input type="radio" name="imageSource" value="asset">
                <span>Choose from Assets</span>
            </label>
        `;

        // Create asset gallery
        const assetGallery = document.createElement('div');
        assetGallery.id = 'assetGallery';
        assetGallery.className = 'asset-gallery hidden';
        
        PRIZE_ASSETS.forEach(asset => {
            const assetItem = document.createElement('div');
            assetItem.className = 'asset-item';
            assetItem.dataset.assetId = asset.id;
            assetItem.dataset.assetPath = asset.path;
            
            // Use getAssetUrl for proper path resolution
            const imageUrl = getAssetUrl(asset.filename);
            
            assetItem.innerHTML = `
                <img src="${imageUrl}" alt="${asset.name}" title="${asset.description}">
                <span>${asset.name}</span>
            `;
            
            assetItem.addEventListener('click', () => {
                this.selectAsset(asset);
            });
            
            assetGallery.appendChild(assetItem);
        });

        // Create image preview
        const previewContainer = document.createElement('div');
        previewContainer.id = 'imagePreview';
        previewContainer.className = 'image-preview';
        previewContainer.innerHTML = `
            <label>Preview:</label>
            <div class="preview-content">
                <img id="previewImage" src="" alt="No image selected" style="display: none;">
                <span id="previewText">No image selected</span>
            </div>
        `;

        // Add event listeners for radio buttons
        const radioButtons = [urlOption, assetOption];
        radioButtons.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            radio.addEventListener('change', () => {
                this.handleImageSourceChange(radio.value);
            });
        });

        // Add URL input change listener for preview
        prizeImageInput.addEventListener('input', () => {
            this.updateImagePreview(prizeImageInput.value);
        });

        // Insert elements into DOM
        container.insertBefore(sourceLabel, prizeImageInput);
        container.insertBefore(selectorContainer, prizeImageInput);
        selectorContainer.appendChild(urlOption);
        selectorContainer.appendChild(assetOption);
        selectorContainer.appendChild(assetGallery);
        container.insertBefore(previewContainer, prizeImageInput.nextSibling);
    }

    updateImageSourceSelector(currentImage) {
        const urlRadio = document.querySelector('input[name="imageSource"][value="url"]');
        const assetRadio = document.querySelector('input[name="imageSource"][value="asset"]');
        
        // Check if current image is from assets by comparing with generated URLs
        const isAssetImage = PRIZE_ASSETS.some(asset => {
            const assetUrl = getAssetUrl(asset.filename);
            return currentImage === assetUrl || currentImage === asset.path || currentImage.includes(asset.filename);
        });
        
        if (isAssetImage) {
            assetRadio.checked = true;
            this.handleImageSourceChange('asset');
            // Select the matching asset
            const matchingAsset = PRIZE_ASSETS.find(asset => {
                const assetUrl = getAssetUrl(asset.filename);
                return currentImage === assetUrl || currentImage === asset.path || currentImage.includes(asset.filename);
            });
            if (matchingAsset) {
                this.highlightSelectedAsset(matchingAsset.id);
            }
        } else {
            urlRadio.checked = true;
            this.handleImageSourceChange('url');
        }
        
        this.updateImagePreview(currentImage);
    }

    handleImageSourceChange(source) {
        const prizeImageInput = document.getElementById('prizeImage');
        const assetGallery = document.getElementById('assetGallery');
        
        if (source === 'asset') {
            prizeImageInput.style.display = 'none';
            assetGallery.classList.remove('hidden');
        } else {
            prizeImageInput.style.display = 'block';
            assetGallery.classList.add('hidden');
            this.clearAssetSelection();
        }
    }

    selectAsset(asset) {
        const prizeImageInput = document.getElementById('prizeImage');
        const imageUrl = getAssetUrl(asset.filename);
        prizeImageInput.value = imageUrl;
        this.highlightSelectedAsset(asset.id);
        this.updateImagePreview(imageUrl);
    }

    highlightSelectedAsset(assetId) {
        // Remove previous selection
        document.querySelectorAll('.asset-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Highlight selected asset
        const selectedItem = document.querySelector(`[data-asset-id="${assetId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }

    clearAssetSelection() {
        document.querySelectorAll('.asset-item').forEach(item => {
            item.classList.remove('selected');
        });
    }

    updateImagePreview(imageSrc) {
        const previewImage = document.getElementById('previewImage');
        const previewText = document.getElementById('previewText');
        
        if (imageSrc && imageSrc.trim()) {
            previewImage.src = imageSrc;
            previewImage.style.display = 'block';
            previewText.style.display = 'none';
            
            // Handle image load error
            previewImage.onerror = () => {
                previewImage.style.display = 'none';
                previewText.style.display = 'block';
                previewText.textContent = 'Failed to load image';
            };
        } else {
            previewImage.style.display = 'none';
            previewText.style.display = 'block';
            previewText.textContent = 'No image selected';
        }
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

        // Handle auto-adjustment if total exceeds 100%
        if (totalChance > 100) {
            const excess = totalChance - 100;
            
            // Find the highest percentage prize (excluding the one being edited)
            let highestPrize = null;
            let highestChance = 0;
            
            for (const prize of prizes) {
                if (this.currentEditingPrize && prize.id === this.currentEditingPrize.id) {
                    continue; // Skip the prize being edited
                }
                if (prize.chance > highestChance) {
                    highestChance = prize.chance;
                    highestPrize = prize;
                }
            }
            
            if (highestPrize) {
                // Reduce the highest percentage prize by the excess amount
                const newHighestChance = Math.max(0.1, highestChance - excess);
                
                // Update the highest prize first
                const updatedHighestPrize = {
                    ...highestPrize,
                    chance: newHighestChance
                };
                storageManager.updatePrize(updatedHighestPrize);
                
                msg.textContent = `Auto-adjusted: "${highestPrize.name}" reduced from ${highestChance}% to ${newHighestChance.toFixed(1)}% to maintain 100% total.`;
                msg.style.color = '#ff8f00';
            }
        }

        // Allow saving/updating even if total is less than 100%
        const finalTotal = Math.min(totalChance, 100);
        if (finalTotal < 100) {
            msg.textContent = `Saved. ${100 - finalTotal}% left to allocate. You must reach 100% before finishing.`;
            msg.style.color = '#e67e22';
        } else {
            if (totalChance > 100) {
                msg.textContent = 'Saved with auto-adjustment! Total win chance is now 100%.';
            } else {
                msg.textContent = 'Saved! Total win chance is 100%. Ready to go.';
            }
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

        // Hide the auto-adjust warning since we've handled it
        this.hideAutoAdjustWarning();

        // Only close editor if total is 100
        const newTotalChance = storageManager.getPrizes().reduce((sum, p) => sum + p.chance, 0);
        if (Math.abs(newTotalChance - 100) < 0.01) {
            this.hidePrizeEditor();
        }
        this.refreshPrizesList();

        // Update the main app display and refresh reels
        if (window.slotMachine) {
            window.slotMachine.updatePrizeDisplay();
            window.slotMachine.populateReels();
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
            
            // Update the main app display and refresh reels
            if (window.slotMachine) {
                window.slotMachine.updatePrizeDisplay();
                window.slotMachine.populateReels();
            }
        }
    }

    // Settings Management
    refreshSettings() {
        // Settings tab now just shows information about probability mode
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

    refreshSlotMachine() {
        // Refresh the slot machine reels with updated prize data
        if (window.slotMachine) {
            window.slotMachine.populateReels();
        }
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

// Make showAdminLogin globally available
window.showAdminLogin = showAdminLogin;

// Global admin panel instance
window.adminPanel = new AdminPanel();