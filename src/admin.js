// Admin panel functionality
import './storage.js'; // Initialize storage manager
import { PRIZE_ASSETS, getAssetUrl } from './assets/assets.js';
import { createWinChanceSlider, addWinChanceSliderStyles } from './sliderComponents.js';

// Shorthand reference to storage manager
const storageManager = () => window.storageManager;

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
            const prizes = storageManager().getPrizes();
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
        const prizes = storageManager().getPrizes();
        
        container.innerHTML = '';
        
        prizes.forEach(prize => {
            const prizeCard = document.createElement('div');
            prizeCard.className = 'prize-card';
            prizeCard.setAttribute('data-prize-id', prize.id); // Add data attribute for easier targeting
            prizeCard.innerHTML = `
                <img src="${prize.image}" alt="${prize.name}" onerror="this.src='/assets/images/Sad_cat.png'">
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

        // Add win chance slider styles if not already added
        addWinChanceSliderStyles();

        // Create win chance slider if it doesn't exist
        if (!document.getElementById('winChance-slider')) {
            const chanceInput = document.getElementById('prizeChance');
            const sliderContainer = document.createElement('div');
            sliderContainer.id = 'winChanceSliderContainer';
            chanceInput.parentNode.insertBefore(sliderContainer, chanceInput.nextSibling);
            
            this.winChanceSlider = createWinChanceSlider(
                'winChanceSliderContainer',
                'prizeChance',
                0,
                false,
                null,
                () => this.updateChanceMessage() // Callback to update chance message
            );
        }

        // Create image source selector after all labels are created
        this.createImageSourceSelector();
        addWinChanceSliderStyles();

        // Create win chance slider if it doesn't exist
        if (!document.getElementById('winChance-slider')) {
            const chanceInput = document.getElementById('prizeChance');
            const sliderContainer = document.createElement('div');
            sliderContainer.id = 'winChanceSliderContainer';
            chanceInput.parentNode.insertBefore(sliderContainer, chanceInput.nextSibling);
            
            this.winChanceSlider = createWinChanceSlider(
                'winChanceSliderContainer',
                'prizeChance',
                0,
                false,
                null,
                () => this.updateChanceMessage() // Callback to update chance message
            );
        }

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

        // NOW set slider values after message element exists
        if (prize) {
            // Update win chance slider for existing prize
            if (this.winChanceSlider) {
                this.winChanceSlider.setValue(prize.chance);
            }
            // Trigger chance message update to show any warnings
            this.updateChanceMessage();
        } else {
            // Reset win chance slider for new prize
            if (this.winChanceSlider) {
                this.winChanceSlider.setValue(0);
            }
        }

        this.updateChanceMessage();

        // Add live update for chance input (only if not already added)
        const chanceInput = document.getElementById('prizeChance');
        if (!chanceInput.hasAttribute('data-listener-added')) {
            chanceInput.addEventListener('input', () => {
                this.updateChanceMessage();
            });
            chanceInput.setAttribute('data-listener-added', 'true');
        }

        // Show which prize is currently the default (highest percentage)
        this.updateDefaultPrizeLabel();

        editor.classList.remove('hidden');
    }

    updateDefaultPrizeLabel() {
        const prizes = storageManager().getPrizes();
        const editor = document.getElementById('prizeEditor');
        
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
        
        if (prizes.length === 0) {
            defaultLabel.textContent = 'No prizes yet - add your first prize!';
        } else {
            const highestPrize = prizes.reduce((max, p) => p.chance > max.chance ? p : max);
            defaultLabel.textContent = `Default Prize: ${highestPrize.name} (${highestPrize.chance}%)`;
        }
    }

    updateChanceMessage() {
        const chanceInput = document.getElementById('prizeChance');
        const chance = parseFloat(chanceInput.value) || 0;
        const prizes = storageManager().getPrizes();
        let totalChance = 0;
        if (this.currentEditingPrize) {
            totalChance = prizes.reduce((sum, p) => sum + (p.id === this.currentEditingPrize.id ? chance : p.chance), 0);
        } else {
            totalChance = prizes.reduce((sum, p) => sum + p.chance, 0) + chance;
        }
        
        let msg = document.getElementById('chanceMessage');
        
        // Create message element if it doesn't exist
        if (!msg) {
            const editor = document.getElementById('prizeEditor');
            msg = document.createElement('div');
            msg.id = 'chanceMessage';
            msg.style.margin = '10px 0';
            msg.style.fontWeight = 'bold';
            msg.style.color = '#e74c3c';
            editor.appendChild(msg);
        }
        
        if (totalChance < 100) {
            msg.textContent = `Total win chance: ${totalChance.toFixed(1)}%. ${(100 - totalChance).toFixed(1)}% left to allocate.`;
            msg.style.color = '#e67e22';
            this.hideAutoAdjustWarning();
        } else if (totalChance > 100) {
            const excess = totalChance - 100;
            msg.textContent = `Total win chance: ${totalChance.toFixed(1)}%. Exceeded by ${excess.toFixed(1)}%.`;
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
                display: block;
                position: relative;
                z-index: 1000;
            `;
            
            // Insert after the chance message
            const chanceMessage = document.getElementById('chanceMessage');
            if (chanceMessage && chanceMessage.parentNode) {
                chanceMessage.parentNode.insertBefore(warningDiv, chanceMessage.nextSibling);
            } else {
                // Fallback: append to editor
                const editor = document.getElementById('prizeEditor');
                editor.appendChild(warningDiv);
            }
        }
        
        // Find the current highest percentage prize (excluding the one being edited)
        const prizes = storageManager().getPrizes();
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
        warningDiv.style.visibility = 'visible';
        warningDiv.style.opacity = '1';
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
                previewImage.src = '/assets/images/Sad_cat.png';
                previewImage.alt = 'Image not found - using default';
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
        const prizes = storageManager().getPrizes();
        let totalChance = 0;
        if (this.currentEditingPrize) {
            totalChance = prizes.reduce((sum, p) => sum + (p.id === this.currentEditingPrize.id ? chance : p.chance), 0);
        } else {
            totalChance = prizes.reduce((sum, p) => sum + p.chance, 0) + chance;
        }

        // Handle auto-adjustment to ensure total always equals 100%
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
                storageManager().updatePrize(updatedHighestPrize);
            }
        } else if (totalChance < 100) {
            const shortfall = 100 - totalChance;
            
            // Find the highest percentage prize (excluding the one being edited) to add the shortfall
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
                // Add the shortfall to the highest percentage prize
                const newHighestChance = Math.min(100, highestChance + shortfall);
                
                // Update the highest prize first
                const updatedHighestPrize = {
                    ...highestPrize,
                    chance: newHighestChance
                };
                storageManager().updatePrize(updatedHighestPrize);
            }
        }

        // Simple success message
        msg.textContent = 'Prize saved successfully!';
        msg.style.color = '#27ae60';

        const prizeData = {
            name,
            image,
            quantity,
            chance
        };

        if (this.currentEditingPrize) {
            // Update existing prize
            prizeData.id = this.currentEditingPrize.id;
            storageManager().updatePrize(prizeData);
        } else {
            // Add new prize
            storageManager().addPrize(prizeData);
        }

        // Hide the auto-adjust warning since we've handled it
        this.hideAutoAdjustWarning();

        // Update default prize label
        this.updateDefaultPrizeLabel();

        // Always close editor since total is now 100%
        this.hidePrizeEditor();
        this.refreshPrizesList();

        // Update the main app display and refresh reels
        if (window.slotMachine) {
            window.slotMachine.updatePrizeDisplay();
            window.slotMachine.populateReels();
        }
    }

    editPrize(prizeId) {
        // First, close any existing inline editors
        this.closeAllInlineEditors();
        
        const prizes = storageManager().getPrizes();
        const prize = prizes.find(p => p.id === prizeId);
        if (prize) {
            this.showInlineEditor(prize, prizeId);
        }
    }

    closeAllInlineEditors() {
        // Clean up inline sliders
        if (this.inlineSliders) {
            this.inlineSliders.forEach((slider, prizeId) => {
                if (slider && slider.destroy) {
                    slider.destroy();
                }
            });
            this.inlineSliders.clear();
        }

        // Remove all existing inline editors
        const existingEditors = document.querySelectorAll('.inline-prize-editor');
        existingEditors.forEach(editor => editor.remove());
        
        // Show all prize cards that might have been hidden
        const prizeCards = document.querySelectorAll('.prize-card');
        prizeCards.forEach(card => card.style.display = 'flex');
    }

    updateInlineChanceMessage(prizeId) {
        // For inline editors, we can show a simple validation message
        // This could be enhanced to show the same warning as the main editor
        const chanceInput = document.getElementById(`inline-prizeChance-${prizeId}`);
        if (chanceInput) {
            const chance = parseFloat(chanceInput.value) || 0;
            const prizes = storageManager().getPrizes();
            const currentPrize = prizes.find(p => p.id === parseInt(prizeId));
            
            let totalChance = 0;
            if (currentPrize) {
                totalChance = prizes.reduce((sum, p) => sum + (p.id === currentPrize.id ? chance : p.chance), 0);
            }
            
            // Add a simple indicator next to the input
            let indicator = document.getElementById(`inline-chance-indicator-${prizeId}`);
            if (!indicator) {
                indicator = document.createElement('span');
                indicator.id = `inline-chance-indicator-${prizeId}`;
                indicator.style.cssText = `
                    margin-left: 10px;
                    font-size: 12px;
                    font-weight: bold;
                `;
                chanceInput.parentNode.appendChild(indicator);
            }
            
            if (totalChance > 100) {
                indicator.textContent = `⚠️ Total: ${totalChance.toFixed(1)}%`;
                indicator.style.color = '#e74c3c';
            } else if (totalChance === 100) {
                indicator.textContent = `✓ Total: 100%`;
                indicator.style.color = '#27ae60';
            } else {
                indicator.textContent = `Total: ${totalChance.toFixed(1)}%`;
                indicator.style.color = '#3498db';
            }
        }
    }

    showInlineEditor(prize, prizeId) {
        // Close any existing inline editors first
        this.closeAllInlineEditors();
        
        // Find the prize card element by data attribute
        const targetCard = document.querySelector(`.prize-card[data-prize-id="${prizeId}"]`);
        
        if (!targetCard) {
            console.error('Target card not found for prize ID:', prizeId);
            return;
        }

        console.log('Found target card:', targetCard);
        console.log('Parent node:', targetCard.parentNode);
        console.log('Next sibling:', targetCard.nextSibling);

        // Create inline editor
        const inlineEditor = document.createElement('div');
        inlineEditor.className = 'inline-prize-editor';
        inlineEditor.id = `inline-editor-${prizeId}`; // Add unique ID for debugging
        inlineEditor.innerHTML = `
            <h3>Edit Prize</h3>
            <div class="editor-form">
                <label for="inline-prizeName-${prizeId}">Prize Name</label>
                <input type="text" id="inline-prizeName-${prizeId}" value="${prize.name}" placeholder="Prize Name">
                
                <label>Image Source</label>
                <div class="inline-image-source-selector">
                    <div class="image-source-option">
                        <label>
                            <input type="radio" name="inline-imageSource-${prizeId}" value="url" checked>
                            <span>Use URL</span>
                        </label>
                    </div>
                    <div class="image-source-option">
                        <label>
                            <input type="radio" name="inline-imageSource-${prizeId}" value="asset">
                            <span>Choose from Assets</span>
                        </label>
                    </div>
                </div>
                
                <label for="inline-prizeImage-${prizeId}">Image URL</label>
                <input type="url" id="inline-prizeImage-${prizeId}" value="${prize.image || ''}" placeholder="Image URL">
                
                <div id="inline-assetGallery-${prizeId}" class="asset-gallery hidden">
                    ${this.generateAssetGalleryHTML(prizeId)}
                </div>
                
                <div class="image-preview-container">
                    <label>Image Preview</label>
                    <div class="image-preview">
                        <img id="inline-previewImage-${prizeId}" src="${prize.image}" alt="Prize Preview" style="display: ${prize.image ? 'block' : 'none'}">
                        <div id="inline-previewText-${prizeId}" style="display: ${prize.image ? 'none' : 'block'}">No image selected</div>
                    </div>
                </div>
                
                <label for="inline-prizeQuantity-${prizeId}">Quantity</label>
                <input type="number" id="inline-prizeQuantity-${prizeId}" value="${prize.quantity}" placeholder="Quantity" min="0">
                
                <label for="inline-prizeChance-${prizeId}">Win Chance (%)</label>
                <input type="number" id="inline-prizeChance-${prizeId}" value="${prize.chance}" placeholder="Win Chance %" min="0" max="100" step="0.1">
                
                <div id="inline-winChanceSliderContainer-${prizeId}"></div>
                
                <div id="inline-chanceMessage-${prizeId}" style="margin: 10px 0; font-weight: bold; color: #e74c3c;"></div>
                
                <div class="editor-buttons">
                    <button class="save-btn" onclick="adminPanel.saveInlineEdit(${prizeId})">Save Changes</button>
                    <button class="cancel-btn" onclick="adminPanel.closeAllInlineEditors()">Cancel</button>
                </div>
            </div>
        `;

        // Insert the editor right after the prize card
        console.log('Inserting inline editor after target card');
        targetCard.parentNode.insertBefore(inlineEditor, targetCard.nextSibling);
        console.log('Inline editor inserted at:', inlineEditor.offsetTop);

        // Set up event listeners
        this.setupInlineEditorEvents(prizeId, prize.image);

        // Scroll the editor into view
        setTimeout(() => {
            inlineEditor.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }, 100);
    }

    generateAssetGalleryHTML(prizeId) {
        return PRIZE_ASSETS.map(asset => {
            const imageUrl = getAssetUrl(asset.filename);
            return `
                <div class="asset-item" data-asset-id="${asset.id}" data-asset-path="${asset.path}" data-prize-id="${prizeId}">
                    <img src="${imageUrl}" alt="${asset.name}" title="${asset.description}">
                    <span>${asset.name}</span>
                </div>
            `;
        }).join('');
    }

    setupInlineEditorEvents(prizeId, currentImage) {
        // Add win chance slider styles if not already added
        addWinChanceSliderStyles();

        // Create win chance slider for inline editor
        const currentChance = document.getElementById(`inline-prizeChance-${prizeId}`).value;
        const inlineSlider = createWinChanceSlider(
            `inline-winChanceSliderContainer-${prizeId}`,
            `inline-prizeChance-${prizeId}`,
            parseFloat(currentChance) || 0,
            true,
            prizeId,
            () => this.updateInlineChanceMessage && this.updateInlineChanceMessage(prizeId) // Callback for inline updates
        );

        // Store reference to slider for cleanup
        if (!this.inlineSliders) {
            this.inlineSliders = new Map();
        }
        this.inlineSliders.set(prizeId, inlineSlider);

        // Image URL input change listener for preview
        const imageInput = document.getElementById(`inline-prizeImage-${prizeId}`);
        const previewImage = document.getElementById(`inline-previewImage-${prizeId}`);
        const previewText = document.getElementById(`inline-previewText-${prizeId}`);
        
        imageInput.addEventListener('input', () => {
            this.updateInlineImagePreview(prizeId, imageInput.value.trim());
        });

        // Radio button change listeners
        const radioButtons = document.querySelectorAll(`input[name="inline-imageSource-${prizeId}"]`);
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                this.handleInlineImageSourceChange(prizeId, radio.value);
            });
        });

        // Asset gallery click listeners
        const assetItems = document.querySelectorAll(`[data-prize-id="${prizeId}"].asset-item`);
        assetItems.forEach(item => {
            item.addEventListener('click', () => {
                const assetId = item.dataset.assetId;
                const asset = PRIZE_ASSETS.find(a => a.id === assetId);
                if (asset) {
                    this.selectInlineAsset(prizeId, asset);
                }
            });
        });

        // Set initial state based on current image
        this.updateInlineImageSourceState(prizeId, currentImage);
        
        // Add chance input listener for real-time updates
        const chanceInput = document.getElementById(`inline-prizeChance-${prizeId}`);
        chanceInput.addEventListener('input', () => {
            this.updateInlineChanceMessage(prizeId);
        });
        
        // Initialize chance message
        this.updateInlineChanceMessage(prizeId);
    }

    updateInlineChanceMessage(prizeId) {
        const chanceInput = document.getElementById(`inline-prizeChance-${prizeId}`);
        const chance = parseFloat(chanceInput.value) || 0;
        const prizes = storageManager().getPrizes();
        
        // Calculate total chance including this inline edit
        const totalChance = prizes.reduce((sum, p) => sum + (p.id === prizeId ? chance : p.chance), 0);
        
        let msg = document.getElementById(`inline-chanceMessage-${prizeId}`);
        if (!msg) return; // Safety check
        
        if (totalChance < 100) {
            msg.textContent = `Total win chance: ${totalChance.toFixed(1)}%. ${(100 - totalChance).toFixed(1)}% left to allocate.`;
            msg.style.color = '#e67e22';
            this.hideInlineAutoAdjustWarning(prizeId);
        } else if (totalChance > 100) {
            const excess = totalChance - 100;
            msg.textContent = `Total win chance: ${totalChance.toFixed(1)}%. Exceeded by ${excess.toFixed(1)}%.`;
            msg.style.color = '#e74c3c';
            this.showInlineAutoAdjustWarning(prizeId, excess);
        } else {
            msg.textContent = `Total win chance: 100%. Ready to save!`;
            msg.style.color = '#27ae60';
            this.hideInlineAutoAdjustWarning(prizeId);
        }
    }

    showInlineAutoAdjustWarning(prizeId, excessPercentage) {
        let warningDiv = document.getElementById(`inline-autoAdjustWarning-${prizeId}`);
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.id = `inline-autoAdjustWarning-${prizeId}`;
            warningDiv.style.cssText = `
                margin: 15px 0;
                padding: 15px;
                background-color: rgba(255, 193, 7, 0.1);
                border: 2px solid #ffc107;
                border-radius: 8px;
                color: #ff8f00;
                font-weight: bold;
                font-size: 0.95em;
                display: block;
                position: relative;
                z-index: 1000;
            `;
            
            // Insert after the chance message
            const chanceMessage = document.getElementById(`inline-chanceMessage-${prizeId}`);
            if (chanceMessage && chanceMessage.parentNode) {
                chanceMessage.parentNode.insertBefore(warningDiv, chanceMessage.nextSibling);
            }
        }
        
        // Find the current highest percentage prize (excluding the one being edited)
        const prizes = storageManager().getPrizes();
        let highestPrize = null;
        let highestChance = 0;
        
        for (const prize of prizes) {
            if (prize.id === prizeId) {
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
        warningDiv.style.visibility = 'visible';
        warningDiv.style.opacity = '1';
    }

    hideInlineAutoAdjustWarning(prizeId) {
        const warningDiv = document.getElementById(`inline-autoAdjustWarning-${prizeId}`);
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
    }

    handleInlineImageSourceChange(prizeId, sourceType) {
        const imageInput = document.getElementById(`inline-prizeImage-${prizeId}`);
        const assetGallery = document.getElementById(`inline-assetGallery-${prizeId}`);
        
        if (sourceType === 'asset') {
            imageInput.style.display = 'none';
            assetGallery.classList.remove('hidden');
        } else {
            imageInput.style.display = 'block';
            assetGallery.classList.add('hidden');
            this.clearInlineAssetSelection(prizeId);
        }
    }

    selectInlineAsset(prizeId, asset) {
        const imageInput = document.getElementById(`inline-prizeImage-${prizeId}`);
        const imageUrl = getAssetUrl(asset.filename);
        imageInput.value = imageUrl;
        this.highlightInlineSelectedAsset(prizeId, asset.id);
        this.updateInlineImagePreview(prizeId, imageUrl);
    }

    highlightInlineSelectedAsset(prizeId, assetId) {
        // Remove previous selection for this prize editor
        const assetItems = document.querySelectorAll(`[data-prize-id="${prizeId}"].asset-item`);
        assetItems.forEach(item => {
            item.classList.remove('selected');
        });
        
        // Highlight selected asset
        const selectedItem = document.querySelector(`[data-asset-id="${assetId}"][data-prize-id="${prizeId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }

    clearInlineAssetSelection(prizeId) {
        const assetItems = document.querySelectorAll(`[data-prize-id="${prizeId}"].asset-item`);
        assetItems.forEach(item => {
            item.classList.remove('selected');
        });
    }

    updateInlineImagePreview(prizeId, imageSrc) {
        const previewImage = document.getElementById(`inline-previewImage-${prizeId}`);
        const previewText = document.getElementById(`inline-previewText-${prizeId}`);
        
        if (imageSrc && imageSrc.trim()) {
            previewImage.src = imageSrc;
            previewImage.style.display = 'block';
            previewText.style.display = 'none';
            
            previewImage.onerror = () => {
                previewImage.src = '/assets/images/Sad_cat.png';
                previewImage.alt = 'Image not found - using default';
            };
        } else {
            previewImage.style.display = 'none';
            previewText.style.display = 'block';
        }
    }

    updateInlineImageSourceState(prizeId, currentImage) {
        const urlRadio = document.querySelector(`input[name="inline-imageSource-${prizeId}"][value="url"]`);
        const assetRadio = document.querySelector(`input[name="inline-imageSource-${prizeId}"][value="asset"]`);
        
        // Check if current image matches any asset
        const isAssetImage = PRIZE_ASSETS.some(asset => {
            const assetUrl = getAssetUrl(asset.filename);
            return currentImage === assetUrl || currentImage === asset.path;
        });

        if (isAssetImage && currentImage) {
            // Select asset radio and find matching asset
            assetRadio.checked = true;
            const matchingAsset = PRIZE_ASSETS.find(asset => {
                const assetUrl = getAssetUrl(asset.filename);
                return currentImage === assetUrl || currentImage === asset.path;
            });
            
            if (matchingAsset) {
                this.handleInlineImageSourceChange(prizeId, 'asset');
                this.highlightInlineSelectedAsset(prizeId, matchingAsset.id);
            }
        } else {
            // Select URL radio
            urlRadio.checked = true;
            this.handleInlineImageSourceChange(prizeId, 'url');
        }
    }

    saveInlineEdit(prizeId) {
        const prizeName = document.getElementById(`inline-prizeName-${prizeId}`).value.trim();
        const prizeImage = document.getElementById(`inline-prizeImage-${prizeId}`).value.trim();
        const prizeQuantity = parseInt(document.getElementById(`inline-prizeQuantity-${prizeId}`).value);
        const prizeChance = parseFloat(document.getElementById(`inline-prizeChance-${prizeId}`).value);

        // Validation
        if (!prizeName) {
            alert('Prize name is required');
            return;
        }

        if (isNaN(prizeQuantity) || prizeQuantity < 0) {
            alert('Please enter a valid quantity (0 or more)');
            return;
        }

        if (isNaN(prizeChance) || prizeChance < 0 || prizeChance > 100) {
            alert('Please enter a valid win chance between 0 and 100');
            return;
        }

        // Update the prize
        const updatedPrize = {
            id: prizeId,
            name: prizeName,
            image: prizeImage,
            quantity: prizeQuantity,
            chance: prizeChance
        };

        // Calculate total chance and auto-adjust to 100%
        const prizes = storageManager().getPrizes();
        const totalChance = prizes.reduce((sum, p) => sum + (p.id === prizeId ? prizeChance : p.chance), 0);

        // Handle auto-adjustment to ensure total always equals 100%
        if (totalChance !== 100) {
            if (totalChance > 100) {
                const excess = totalChance - 100;
                // Find the highest percentage prize (excluding the one being edited)
                let highestPrize = null;
                let highestChance = 0;
                
                for (const prize of prizes) {
                    if (prize.id === prizeId) continue; // Skip the prize being edited
                    if (prize.chance > highestChance) {
                        highestChance = prize.chance;
                        highestPrize = prize;
                    }
                }
                
                if (highestPrize) {
                    const newHighestChance = Math.max(0.1, highestChance - excess);
                    const adjustedPrize = { ...highestPrize, chance: newHighestChance };
                    storageManager().updatePrize(adjustedPrize);
                }
            } else if (totalChance < 100) {
                const shortfall = 100 - totalChance;
                // Find the highest percentage prize (excluding the one being edited)
                let highestPrize = null;
                let highestChance = 0;
                
                for (const prize of prizes) {
                    if (prize.id === prizeId) continue; // Skip the prize being edited
                    if (prize.chance > highestChance) {
                        highestChance = prize.chance;
                        highestPrize = prize;
                    }
                }
                
                if (highestPrize) {
                    const newHighestChance = Math.min(100, highestChance + shortfall);
                    const adjustedPrize = { ...highestPrize, chance: newHighestChance };
                    storageManager().updatePrize(adjustedPrize);
                }
            }
        }
        
        // Update the main prize after auto-adjustment
        storageManager().updatePrize(updatedPrize);

        if (true) { // Always succeeds now since we handle auto-adjustment
            this.closeAllInlineEditors();
            this.refreshPrizesList();
            
            // Update the main app display and refresh reels
            if (window.slotMachine) {
                window.slotMachine.updatePrizeDisplay();
                window.slotMachine.populateReels();
            }
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.textContent = 'Prize updated successfully!';
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2ecc71;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 10000;
                font-weight: bold;
            `;
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
                successMsg.remove();
            }, 3000);
        } else {
            alert('Failed to update prize');
        }
    }

    deletePrize(prizeId) {
        if (confirm('Are you sure you want to delete this prize?')) {
            const prizes = storageManager().getPrizes();
            const prizeToDelete = prizes.find(p => p.id === prizeId);
            
            if (!prizeToDelete) return;
            
            // Get the percentage from the prize being deleted
            const deletedPercentage = prizeToDelete.chance;
            
            // Delete the prize first
            storageManager().deletePrize(prizeId);
            
            // If there are remaining prizes, add the deleted percentage to the highest one
            const remainingPrizes = storageManager().getPrizes();
            if (remainingPrizes.length > 0 && deletedPercentage > 0) {
                // Find the prize with the highest percentage (the default prize)
                const defaultPrize = remainingPrizes.reduce((max, p) => p.chance > max.chance ? p : max);
                
                // Add the deleted percentage to the default prize
                const updatedDefaultPrize = {
                    ...defaultPrize,
                    chance: Math.min(100, defaultPrize.chance + deletedPercentage) // Cap at 100%
                };
                
                // Update the default prize in storage
                storageManager().updatePrize(updatedDefaultPrize);
                
                // Show notification about the redistribution
                const notification = document.createElement('div');
                notification.textContent = `Prize deleted. ${deletedPercentage}% redistributed to "${defaultPrize.name}" (now ${updatedDefaultPrize.chance}%)`;
                notification.style.cssText = `
                    position: fixed;
                    top: 70px;
                    right: 20px;
                    background: #27ae60;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 5px;
                    z-index: 10000;
                    font-weight: bold;
                    max-width: 400px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                `;
                document.body.appendChild(notification);
                
                // Remove notification after 4 seconds
                setTimeout(() => {
                    notification.remove();
                }, 4000);
            }
            
            this.refreshPrizesList();
            
            // Update default prize label
            this.updateDefaultPrizeLabel();
            
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
        storageManager().resetAll();
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
        const logs = storageManager().getLogs();
        
        container.innerHTML = '';
        
        if (logs.length === 0) {
            container.innerHTML = '<p>No spins recorded yet.</p>';
            return;
        }

        logs.forEach((log, index) => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            const date = new Date(log.timestamp).toLocaleString();
            const spinNumber = logs.length - index; // Reverse numbering so newest spin has highest number
            logEntry.innerHTML = `
                <strong>${date}</strong><br>
                Spin #${spinNumber}<br>
                Prize: ${log.prizeName}
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
