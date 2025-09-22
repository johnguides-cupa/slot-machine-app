// Performance Mode Selection Modal
import { performanceManager } from './performanceManager.js';

export class ModeSelectionModal {
    constructor() {
        this.container = null;
        this.isVisible = false;
        this.onSelectionCallback = null;
    }

    // Show the mode selection modal
    show(onSelection = null) {
        this.onSelectionCallback = onSelection;
        
        // Return a Promise for the selection
        return new Promise((resolve, reject) => {
            this.resolveSelection = resolve;
            this.rejectSelection = reject;
            
            this.createModalHTML();
            this.attachEventListeners();
            document.body.appendChild(this.container);
            this.isVisible = true;
            
            // Animate in
            setTimeout(() => {
                this.container.style.opacity = '1';
            }, 10);
        });
    }

    // Hide the modal
    hide() {
        if (!this.container) return;
        
        this.container.style.opacity = '0';
        this.isVisible = false;
        
        setTimeout(() => {
            if (this.container && this.container.parentNode) {
                this.container.parentNode.removeChild(this.container);
            }
        }, 300);
    }

    // Create the modal HTML structure
    createModalHTML() {
        this.container = document.createElement('div');
        this.container.id = 'mode-selection-modal';
        
        const modes = performanceManager.getAvailableModes();
        const currentMode = performanceManager.getMode();
        const currentModeInfo = currentMode ? performanceManager.getModeInfo(currentMode) : null;
        
        // Create current mode display
        let currentModeDisplay = '';
        if (currentModeInfo) {
            currentModeDisplay = `
                <div class="current-mode-indicator">
                    <span class="current-mode-label">Current Mode:</span>
                    <span class="current-mode-value">
                        ${currentModeInfo.icon} ${currentModeInfo.name}
                    </span>
                </div>
            `;
        }
        
        const modeOptions = modes.map(mode => {
            const info = performanceManager.getModeInfo(mode);
            const isCurrentMode = mode === currentMode;
            return `
                <div class="mode-option ${isCurrentMode ? 'current-mode' : ''}" data-mode="${mode}">
                    <div class="mode-icon">${info.icon}</div>
                    <div class="mode-content">
                        <h3 class="mode-title">
                            ${info.name}
                            ${isCurrentMode ? '<span class="current-badge">Current</span>' : ''}
                        </h3>
                        <p class="mode-description">${info.description}</p>
                    </div>
                    <div class="mode-selector">
                        <div class="radio-button">
                            <input type="radio" name="performance-mode" value="${mode}" id="mode-${mode}" ${isCurrentMode ? 'checked' : ''}>
                            <label for="mode-${mode}"></label>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.container.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="header-icon">⚙️</div>
                        <h2>Choose Your Experience</h2>
                        <p class="header-subtitle">Select the performance mode that works best for your device</p>
                        ${currentModeDisplay}
                    </div>
                    
                    <div class="mode-options">
                        ${modeOptions}
                    </div>
                    
                    <div class="modal-footer">
                        <div class="remember-choice">
                            <input type="checkbox" id="remember-choice" checked>
                            <label for="remember-choice">Remember my choice</label>
                        </div>
                        
                        <div class="modal-actions">
                            <button class="continue-btn" id="continue-btn" disabled>
                                <span>Continue</span>
                                <span class="btn-arrow">→</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="modal-help">
                        <p>💡 You can change this setting anytime from the main screen</p>
                    </div>
                </div>
            </div>
        `;

        this.addModalStyles();
    }

    // Add CSS styles for the modal
    addModalStyles() {
        const style = document.createElement('style');
        style.id = 'mode-selection-styles';
        style.textContent = `
            #mode-selection-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s ease;
                font-family: 'Open Sans', sans-serif;
            }

            .modal-backdrop {
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .modal-content {
                background: linear-gradient(145deg, #2c3e50 0%, #34495e 100%);
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 
                    0 20px 60px rgba(0, 0, 0, 0.8),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                border: 2px solid #3498db;
                color: white;
            }

            .modal-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .header-icon {
                font-size: 3em;
                margin-bottom: 15px;
            }

            .modal-header h2 {
                font-family: 'Value Serif', serif;
                font-size: 2.2em;
                font-weight: 700;
                margin: 0 0 10px 0;
                color: #FFD700;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            }

            .header-subtitle {
                font-size: 1.1em;
                color: #8EE8D8;
                margin: 0;
                opacity: 0.9;
            }

            .current-mode-indicator {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 15px;
                padding: 10px 15px;
                background: rgba(142, 232, 216, 0.1);
                border: 1px solid rgba(142, 232, 216, 0.3);
                border-radius: 8px;
                font-size: 0.95em;
            }

            .current-mode-label {
                color: #8EE8D8;
                opacity: 0.8;
            }

            .current-mode-value {
                color: #FFD700;
                font-weight: 600;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
            }

            .current-badge {
                background: #27AE60;
                color: white;
                font-size: 0.7em;
                padding: 2px 8px;
                border-radius: 12px;
                margin-left: 8px;
                font-weight: 500;
                text-shadow: none;
            }

            .mode-option.current-mode {
                border-color: #27AE60;
                background: rgba(39, 174, 96, 0.1);
            }

            .mode-options {
                display: flex;
                flex-direction: column;
                gap: 15px;
                margin-bottom: 30px;
            }

            .mode-option {
                display: flex;
                align-items: center;
                gap: 20px;
                padding: 20px;
                background: rgba(52, 73, 94, 0.5);
                border: 2px solid transparent;
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }

            .mode-option:hover {
                background: rgba(52, 152, 219, 0.1);
                border-color: #3498db;
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
            }

            .mode-option.selected {
                background: rgba(52, 152, 219, 0.2);
                border-color: #3498db;
                box-shadow: 0 0 20px rgba(52, 152, 219, 0.4);
            }

            .mode-icon {
                font-size: 2.5em;
                min-width: 60px;
                text-align: center;
            }

            .mode-content {
                flex: 1;
            }

            .mode-title {
                font-family: 'Value Sans', sans-serif;
                font-size: 1.3em;
                font-weight: 600;
                margin: 0 0 8px 0;
                color: #FFD700;
            }

            .mode-description {
                font-size: 0.95em;
                color: #ecf0f1;
                margin: 0;
                line-height: 1.4;
                white-space: pre-line;
                opacity: 0.9;
            }

            .mode-selector {
                display: flex;
                align-items: center;
            }

            .radio-button {
                position: relative;
            }

            .radio-button input[type="radio"] {
                opacity: 0;
                position: absolute;
                width: 20px;
                height: 20px;
                margin: 0;
            }

            .radio-button label {
                display: block;
                width: 20px;
                height: 20px;
                border: 2px solid #8EE8D8;
                border-radius: 50%;
                background: transparent;
                cursor: pointer;
                position: relative;
                transition: all 0.3s ease;
            }

            .radio-button input[type="radio"]:checked + label {
                border-color: #FFD700;
                background: #FFD700;
                box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            }

            .radio-button input[type="radio"]:checked + label::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 8px;
                height: 8px;
                background: #2c3e50;
                border-radius: 50%;
            }

            .modal-footer {
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 25px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 15px;
            }

            .remember-choice {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .remember-choice input[type="checkbox"] {
                width: 18px;
                height: 18px;
                accent-color: #3498db;
            }

            .remember-choice label {
                color: #8EE8D8;
                font-size: 0.95em;
                cursor: pointer;
            }

            .modal-actions {
                display: flex;
                gap: 15px;
            }

            .continue-btn {
                background: linear-gradient(145deg, #27ae60, #2ecc71);
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 10px;
                font-size: 1.1em;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 120px;
                justify-content: center;
            }

            .continue-btn:disabled {
                background: #7f8c8d;
                cursor: not-allowed;
                opacity: 0.6;
            }

            .continue-btn:not(:disabled):hover {
                background: linear-gradient(145deg, #2ecc71, #27ae60);
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(39, 174, 96, 0.4);
            }

            .btn-arrow {
                font-size: 1.2em;
                transition: transform 0.3s ease;
            }

            .continue-btn:not(:disabled):hover .btn-arrow {
                transform: translateX(3px);
            }

            .modal-help {
                text-align: center;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .modal-help p {
                color: #8EE8D8;
                font-size: 0.9em;
                margin: 0;
                opacity: 0.8;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .modal-content {
                    padding: 25px;
                    margin: 10px;
                }
                
                .mode-option {
                    flex-direction: column;
                    text-align: center;
                    gap: 15px;
                }
                
                .mode-icon {
                    font-size: 2em;
                }
                
                .modal-footer {
                    flex-direction: column;
                    gap: 20px;
                }
                
                .continue-btn {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Attach event listeners
    attachEventListeners() {
        const radioButtons = this.container.querySelectorAll('input[name="performance-mode"]');
        const continueBtn = this.container.querySelector('#continue-btn');
        const modeOptions = this.container.querySelectorAll('.mode-option');

        // Initialize - enable continue button if a mode is already selected
        const selectedRadio = this.container.querySelector('input[name="performance-mode"]:checked');
        if (selectedRadio) {
            continueBtn.disabled = false;
            const selectedOption = this.container.querySelector(`[data-mode="${selectedRadio.value}"]`);
            if (selectedOption) {
                selectedOption.classList.add('selected');
            }
        }

        // Handle mode option clicks
        modeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const mode = option.dataset.mode;
                const radio = option.querySelector('input[type="radio"]');
                radio.checked = true;
                
                // Update UI
                modeOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                
                // Enable continue button
                continueBtn.disabled = false;
            });
        });

        // Handle radio button changes
        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                continueBtn.disabled = false;
                
                // Update visual selection
                modeOptions.forEach(opt => opt.classList.remove('selected'));
                const selectedOption = this.container.querySelector(`[data-mode="${radio.value}"]`);
                if (selectedOption) {
                    selectedOption.classList.add('selected');
                }
            });
        });

        // Handle continue button
        continueBtn.addEventListener('click', () => {
            const selectedMode = this.container.querySelector('input[name="performance-mode"]:checked');
            const rememberChoice = this.container.querySelector('#remember-choice').checked;
            
            if (selectedMode) {
                this.handleModeSelection(selectedMode.value, rememberChoice);
            }
        });

        // Handle keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !continueBtn.disabled) {
                continueBtn.click();
            }
        });
    }

    // Handle mode selection
    handleModeSelection(mode, remember) {
        console.log(`🎯 User selected: ${mode} (remember: ${remember})`);
        
        if (remember) {
            performanceManager.setMode(mode);
        } else {
            // Temporary mode (don't save to localStorage)
            performanceManager.mode = mode;
            performanceManager.notifyListeners();
        }
        
        // Initialize performance optimizations
        performanceManager.initialize();
        
        // Callback to parent
        if (this.onSelectionCallback) {
            this.onSelectionCallback(mode, remember);
        }
        
        // Resolve the Promise with the selected mode
        if (this.resolveSelection) {
            this.resolveSelection(mode);
        }
        
        // Hide modal
        this.hide();
    }

    // Check if modal is visible
    isShown() {
        return this.isVisible;
    }

    // Cleanup styles on destruction
    destroy() {
        this.hide();
        const styles = document.getElementById('mode-selection-styles');
        if (styles) styles.remove();
    }
}

// Export singleton instance
export const modeSelectionModal = new ModeSelectionModal();

// Add to global scope for easy access
if (typeof window !== 'undefined') {
    window.modeSelectionModal = modeSelectionModal;
}