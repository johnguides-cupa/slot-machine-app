// Reusable slider components for the slot machine app

/**
 * Creates a win chance slider with input field synchronization
 * @param {string} containerId - ID of the container to append the slider to
 * @param {string} inputId - ID of the number input field to sync with
 * @param {number} initialValue - Initial value (0-100)
 * @param {boolean} isInline - Whether this is for inline editor (affects IDs)
 * @param {string} prizeId - Prize ID for inline editors
 * @param {function} onChangeCallback - Optional callback function to call when value changes
 * @returns {object} - Object with slider element and update methods
 */
export function createWinChanceSlider(containerId, inputId, initialValue = 0, isInline = false, prizeId = null, onChangeCallback = null) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const sliderPrefix = isInline ? `inline-winChance-${prizeId}` : 'winChance';
    const sliderId = `${sliderPrefix}-slider`;
    const labelId = `${sliderPrefix}-label`;
    
    // Create slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'win-chance-slider-container';
    
    sliderContainer.innerHTML = `
        <div class="slider-row">
            <span id="${labelId}" class="chance-value">${initialValue}%</span>
        </div>
        <div class="slider-controls">
            <input type="range" 
                   id="${sliderId}" 
                   class="win-chance-slider" 
                   min="0" 
                   max="100" 
                   step="0.1" 
                   value="${initialValue}"
                   title="Adjust win chance">
            <div class="chance-marks">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
            </div>
        </div>
    `;

    container.appendChild(sliderContainer);

    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    const numberInput = document.getElementById(inputId);

    // Update label and input when slider changes
    const updateFromSlider = (value) => {
        const numValue = parseFloat(value);
        const displayValue = numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(1);
        
        label.textContent = `${displayValue}%`;
        if (numberInput) {
            numberInput.value = numValue;
            // Trigger input event to ensure other listeners are notified
            numberInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        // Call callback if provided
        if (onChangeCallback && typeof onChangeCallback === 'function') {
            onChangeCallback(numValue);
        }
    };

    // Update slider and label when input changes
    const updateFromInput = (value) => {
        const numValue = Math.max(0, Math.min(100, parseFloat(value) || 0));
        const displayValue = numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(1);
        
        slider.value = numValue;
        label.textContent = `${displayValue}%`;
        
        // Call callback if provided (but only if not triggered by slider to avoid loops)
        if (onChangeCallback && typeof onChangeCallback === 'function') {
            onChangeCallback(numValue);
        }
    };

    // Set up event listeners
    slider.addEventListener('input', (e) => {
        updateFromSlider(e.target.value);
    });

    // Listen for input field changes if it exists
    if (numberInput) {
        numberInput.addEventListener('input', (e) => {
            updateFromInput(e.target.value);
        });

        // Also update on blur to handle pasted values
        numberInput.addEventListener('blur', (e) => {
            updateFromInput(e.target.value);
        });
    }

    // Return object with methods for external control
    return {
        slider,
        label,
        setValue: (value) => {
            updateFromInput(value);
        },
        getValue: () => parseFloat(slider.value),
        destroy: () => {
            sliderContainer.remove();
        }
    };
}

/**
 * Adds the CSS styles for win chance sliders to the document
 */
export function addWinChanceSliderStyles() {
    // Check if styles already added
    if (document.getElementById('win-chance-slider-styles')) return;

    const style = document.createElement('style');
    style.id = 'win-chance-slider-styles';
    style.textContent = `
        .win-chance-slider-container {
            margin: 15px 0;
            padding: 15px;
            background: rgba(52, 73, 94, 0.8);
            border-radius: 8px;
            border: 1px solid #34495e;
        }

        .slider-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .slider-label {
            font-weight: bold;
            color: #ecf0f1;
            font-size: 14px;
        }

        .chance-value {
            font-weight: bold;
            color: #3498db;
            font-size: 16px;
            min-width: 50px;
            text-align: right;
        }

        .slider-controls {
            position: relative;
        }

        .win-chance-slider {
            width: 100%;
            height: 8px;
            border-radius: 5px;
            background: linear-gradient(to right, #e74c3c 0%, #f39c12 25%, #f1c40f 50%, #27ae60 75%, #2ecc71 100%);
            outline: none;
            -webkit-appearance: none;
            cursor: pointer;
            margin-bottom: 10px;
        }

        .win-chance-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3498db;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
        }

        .win-chance-slider::-webkit-slider-thumb:hover {
            background: #2980b9;
            transform: scale(1.1);
        }

        .win-chance-slider::-webkit-slider-thumb:active {
            transform: scale(1.2);
        }

        .win-chance-slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3498db;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
        }

        .win-chance-slider::-moz-range-thumb:hover {
            background: #2980b9;
            transform: scale(1.1);
        }

        .win-chance-slider::-moz-range-thumb:active {
            transform: scale(1.2);
        }

        .chance-marks {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #95a5a6;
            margin-top: 5px;
        }

        .chance-marks span {
            font-size: 10px;
            color: #bdc3c7;
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
            .win-chance-slider-container {
                margin: 10px 0;
                padding: 12px;
            }

            .win-chance-slider {
                height: 10px;
                margin-bottom: 8px;
            }

            .win-chance-slider::-webkit-slider-thumb {
                width: 24px;
                height: 24px;
            }

            .win-chance-slider::-moz-range-thumb {
                width: 24px;
                height: 24px;
            }

            .slider-label {
                font-size: 13px;
            }

            .chance-value {
                font-size: 15px;
            }

            .chance-marks {
                font-size: 9px;
            }
        }

        /* Touch device optimization */
        @media (pointer: coarse) {
            .win-chance-slider {
                height: 12px;
            }

            .win-chance-slider::-webkit-slider-thumb {
                width: 28px;
                height: 28px;
            }

            .win-chance-slider::-moz-range-thumb {
                width: 28px;
                height: 28px;
            }
        }
    `;

    document.head.appendChild(style);
}
