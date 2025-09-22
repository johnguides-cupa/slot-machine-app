// Sound manager for the slot machine app with Performance Mode Support
class SoundManager {
    constructor() {
        this.sounds = {};
        this.audioContext = null;
        this.isMuted = false;
        this.volume = 0.5; // Default volume 50%
        this.performanceMode = 'high-quality'; // Default to high quality
        this.audioQueue = []; // Queue for performance mode
        this.isPlayingCustomSound = false; // Track custom sound playback
        
        this.initializeSounds();
        this.createVolumeControl();
        
        // Listen for performance mode changes with delay to ensure performanceManager is available
        this.setupPerformanceModeListener();
    }

    // Setup performance mode listener with retry logic
    setupPerformanceModeListener() {
        const registerListener = () => {
            if (window.performanceManager && window.performanceManager.addListener) {
                console.log('🔗 Registering performance mode listener for sound manager');
                window.performanceManager.addListener((mode, config) => {
                    console.log(`🔊 Sound manager received mode change: ${mode}`);
                    this.onPerformanceModeChange(mode, config);
                });
                return true;
            }
            return false;
        };

        // Try immediate registration
        if (registerListener()) {
            return;
        }

        // If immediate registration fails, retry with delays
        console.log('⏳ Performance manager not ready, will retry...');
        setTimeout(() => {
            if (registerListener()) return;
            
            setTimeout(() => {
                if (registerListener()) return;
                
                setTimeout(() => {
                    if (!registerListener()) {
                        console.warn('❌ Could not register performance mode listener after multiple attempts');
                    }
                }, 3000);
            }, 1000);
        }, 100);
    }

    // Handle performance mode changes
    onPerformanceModeChange(mode, config) {
        this.performanceMode = mode;
        console.log(`🔊 Sound system switched to: ${mode}`);
        
        if (mode === 'performance') {
            this.enablePerformanceOptimizations();
        } else {
            this.disablePerformanceOptimizations();
        }
        
        // Update the performance mode label
        this.updatePerformanceModeLabel();
    }

    // Enable performance optimizations for audio
    enablePerformanceOptimizations() {
        // Stop any background sounds immediately
        this.stopBackgroundAmbience();
        
        // Clear audio queue
        this.audioQueue = [];
        
        // Preload only essential sounds
        this.preloadEssentialSounds();
    }

    // Disable performance optimizations (restore high quality)
    disablePerformanceOptimizations() {
        // Can restart background ambience if desired
        // this.startBackgroundAmbience();
    }

    // Preload only essential sounds for performance mode
    preloadEssentialSounds() {
        // Only preload the most important sounds
        const essentialSounds = ['congratulations', 'miaw'];
        
        Object.keys(this.customSounds).forEach(key => {
            if (!essentialSounds.includes(key)) {
                // Pause and reset non-essential sounds
                const audio = this.customSounds[key];
                if (audio) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        });
    }

    // Check if sound should play based on performance mode
    shouldPlaySound(soundType) {
        if (this.isMuted) return false;
        
        if (this.performanceMode === 'performance') {
            // In performance mode, limit concurrent sounds
            if (soundType === 'background' || soundType === 'ambience') {
                return false; // No background sounds in performance mode
            }
            
            // Don't overlap custom sounds in performance mode
            if (this.isPlayingCustomSound && (soundType === 'congratulations' || soundType === 'miaw')) {
                return false;
            }
        }
        
        return true;
    }

    // Initialize audio context and load sounds
    initializeSounds() {
        // Initialize Web Audio API context
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }

        // Load custom MP3 files
        this.loadCustomSounds();

        // Define sound URLs (you can replace these with your own sound files)
        const soundUrls = {
            spin: 'https://www.soundjay.com/misc/sounds/slot-machine-spinning.wav',
            win: 'https://www.soundjay.com/misc/sounds/slot-machine-win.wav',
            lose: 'https://www.soundjay.com/misc/sounds/slot-machine-lose.wav',
            click: 'https://www.soundjay.com/misc/sounds/button-click.wav',
            reelStop: 'https://www.soundjay.com/misc/sounds/slot-reel-stop.wav',
            jackpot: 'https://www.soundjay.com/misc/sounds/jackpot.wav',
            background: 'https://www.soundjay.com/misc/sounds/casino-ambience.wav'
        };

        // For demo purposes, we'll create simple programmatic sounds
        // You can replace these with actual audio file loading
        this.createProgrammaticSounds();
    }

    // Load custom MP3 sound files with performance optimizations
    loadCustomSounds() {
        this.customSounds = {};
        
        // Load congratulations sound with performance settings
        const congratsAudio = new Audio('./assets/sounds/Congratulations.mp3');
        congratsAudio.volume = this.volume;
        
        // Performance mode settings
        if (this.performanceMode === 'performance') {
            congratsAudio.preload = 'metadata'; // Only load metadata
        } else {
            congratsAudio.preload = 'auto'; // Preload entire file
        }
        
        this.customSounds.congratulations = congratsAudio;

        // Load miaw sound with performance settings
        const miawAudio = new Audio('./assets/sounds/miaw.mp3');
        miawAudio.volume = this.volume;
        
        if (this.performanceMode === 'performance') {
            miawAudio.preload = 'metadata';
        } else {
            miawAudio.preload = 'auto';
        }
        
        this.customSounds.miaw = miawAudio;

        // Handle loading errors gracefully
        congratsAudio.addEventListener('error', () => {
            console.warn('Could not load congratulations sound');
        });

        miawAudio.addEventListener('error', () => {
            console.warn('Could not load miaw sound');
        });

        // Add event listeners for performance mode tracking
        congratsAudio.addEventListener('ended', () => {
            this.isPlayingCustomSound = false;
        });

        miawAudio.addEventListener('ended', () => {
            this.isPlayingCustomSound = false;
        });
    }

    // Create simple beep sounds programmatically (fallback)
    createProgrammaticSounds() {
        this.sounds = {
            spin: () => this.createSpinSound(),
            win: () => this.createMelody([523, 659, 784, 1047], 0.3), // C-E-G-C chord
            lose: () => this.createTone(150, 0.8, 'sine'),
            click: () => this.createTone(800, 0.1, 'square'),
            reelStop: () => this.createTone(400, 0.2, 'triangle'),
            jackpot: () => this.createCelebrationSound(),
            background: () => this.createAmbientSound()
        };
    }

    // Create a realistic spinning sound with performance mode support
    createSpinSound() {
        if (!this.audioContext || this.isMuted) return;

        // Performance mode optimizations
        const duration = this.performanceMode === 'performance' ? 1.5 : 2.5; // Shorter duration for performance
        const clickCount = this.performanceMode === 'performance' ? 4 : 8; // Fewer clicks for performance
        const clickInterval = this.performanceMode === 'performance' ? 200 : 300; // Faster interval

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filterNode = this.audioContext.createBiquadFilter();

        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Start with a higher frequency and gradually lower it
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + duration);
        
        // Use sawtooth wave for a mechanical sound
        oscillator.type = 'sawtooth';

        // Add some filtering for realism
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filterNode.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + duration);

        // Volume envelope - lower volume in performance mode
        const volumeMultiplier = this.performanceMode === 'performance' ? 0.3 : 0.4;
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * volumeMultiplier, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        // Add clicking sounds to simulate mechanical reels (reduced in performance mode)
        for (let i = 0; i < clickCount; i++) {
            setTimeout(() => {
                this.createTone(600 + Math.random() * 200, 0.05, 'square');
            }, i * clickInterval);
        }
    }

    // Create a single tone
    createTone(frequency, duration, waveType = 'sine') {
        if (!this.audioContext || this.isMuted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = waveType;

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Create a melody (sequence of tones)
    createMelody(frequencies, noteDuration) {
        if (!this.audioContext || this.isMuted) return;

        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, noteDuration, 'sine');
            }, index * noteDuration * 200);
        });
    }

    // Create celebration sound for jackpot
    createCelebrationSound() {
        if (!this.audioContext || this.isMuted) return;

        // Play a rising arpeggio
        const notes = [261, 329, 392, 523, 659, 784, 1047, 1319]; // C major scale
        notes.forEach((freq, index) => {
            setTimeout(() => {
                this.createTone(freq, 0.4, 'sine');
            }, index * 100);
        });

        // Add some sparkle effects
        setTimeout(() => {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    this.createTone(1000 + Math.random() * 1000, 0.1, 'square');
                }, i * 50);
            }
        }, 800);
    }

    // Create ambient background sound (disabled in performance mode)
    createAmbientSound() {
        if (!this.audioContext || this.isMuted) return;

        // Skip ambient sounds in performance mode
        if (this.performanceMode === 'performance') {
            console.log('🔊 Ambient sound skipped in performance mode');
            return;
        }

        // Create a subtle background hum
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(this.volume * 0.1, this.audioContext.currentTime);

        oscillator.start();
        
        // Stop after 5 seconds (you can make this loop)
        setTimeout(() => {
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1);
            oscillator.stop(this.audioContext.currentTime + 1);
        }, 5000);
    }

    // Play specific sound with performance mode support
    playSound(soundName) {
        // Check if sound should play based on performance mode
        if (!this.shouldPlaySound(soundName) || !this.sounds[soundName]) {
            if (this.isMuted) {
                console.log(`Sound ${soundName} muted`);
            } else if (!this.sounds[soundName]) {
                console.warn(`Sound ${soundName} not found`);
            }
            return;
        }

        try {
            // Performance mode optimizations
            if (this.performanceMode === 'performance') {
                // Skip background and ambient sounds in performance mode
                if (soundName === 'background' || soundName === 'ambient') {
                    return;
                }
                
                // Simplified audio context handling for performance
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        this.sounds[soundName]();
                    }).catch(error => {
                        console.warn('Failed to resume audio context:', error);
                    });
                } else {
                    this.sounds[soundName]();
                }
            } else {
                // High quality mode - full audio context management
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        this.sounds[soundName]();
                    }).catch(error => {
                        console.warn('Failed to resume audio context:', error);
                    });
                } else {
                    this.sounds[soundName]();
                }
            }
        } catch (error) {
            console.warn('Error playing sound:', error);
        }
    }

    // Control functions
    mute() {
        this.isMuted = true;
        this.updateVolumeButton();
    }

    unmute() {
        this.isMuted = false;
        this.updateVolumeButton();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.updateVolumeButton();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        // Update custom sounds volume if they exist
        if (this.customSounds) {
            Object.values(this.customSounds).forEach(audio => {
                if (audio) {
                    audio.volume = this.volume;
                }
            });
        }
        
        this.updateVolumeSlider();
    }

    // Create volume control UI at bottom of page
    createVolumeControl() {
        // Create bottom controls container
        let bottomControls = document.querySelector('.bottom-controls');
        if (!bottomControls) {
            bottomControls = document.createElement('div');
            bottomControls.className = 'bottom-controls';
            document.body.appendChild(bottomControls);
        }

        const soundControl = document.createElement('div');
        soundControl.className = 'sound-control';
        soundControl.innerHTML = `
            <div class="sound-controls">
                <button id="muteButton" class="mute-button" title="Toggle Sound">
                    🔊
                </button>
                <input type="range" id="volumeSlider" class="volume-slider" 
                       min="0" max="100" value="50" title="Volume">
                <span class="volume-label">50%</span>
                <button id="testSoundButton" class="test-sound-button" title="Test Sound">
                    🎵
                </button>
            </div>
        `;

        // Add styles for bottom controls
        const style = document.createElement('style');
        style.textContent = `
            .bottom-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 15px;
                margin-top: 30px;
                padding: 20px;
            }
            
            .sound-control {
                display: flex;
                justify-content: center;
            }
            
            .sound-controls {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(0,0,0,0.8);
                padding: 12px 16px;
                border-radius: 25px;
                border: 2px solid #FFD700;
                backdrop-filter: blur(5px);
            }

            .admin-button {
                background: rgba(0,0,0,0.8);
                border: 2px solid #FFD700;
                border-radius: 50%;
                width: 50px;
                height: 50px;
                font-size: 1.5em;
                cursor: pointer;
                transition: all 0.3s ease;
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .admin-button:hover {
                background: rgba(255,215,0,0.2);
                transform: scale(1.1);
            }

            .performance-button {
                background: rgba(52,152,219,0.9) !important;
                border: 2px solid #3498db !important;
                border-radius: 50% !important;
                width: 50px !important;
                height: 50px !important;
                font-size: 1.5em !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                backdrop-filter: blur(5px) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                margin-left: 10px !important;
                z-index: 9999 !important;
                pointer-events: auto !important;
                position: relative !important;
            }

            .performance-button:hover {
                background: rgba(52,152,219,0.2);
                transform: scale(1.1);
            }

            .performance-control {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-left: 10px;
            }

            .performance-label {
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 15px;
                font-size: 0.9em;
                font-weight: 500;
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255,255,255,0.2);
                white-space: nowrap;
                transition: all 0.3s ease;
            }

            .performance-label.high-quality {
                background: rgba(39, 174, 96, 0.9);
                border-color: rgba(39, 174, 96, 0.5);
            }

            .performance-label.performance {
                background: rgba(231, 76, 60, 0.9);
                border-color: rgba(231, 76, 60, 0.5);
            }
            
            .mute-button {
                background: none;
                border: none;
                font-size: 1.5em;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.2s ease;
                color: white;
            }
            
            .mute-button:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .mute-button.muted {
                opacity: 0.5;
            }
            
            .test-sound-button {
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.2s ease;
                color: white;
            }
            
            .test-sound-button:hover {
                background: rgba(255,255,255,0.2);
            }
            
            .volume-slider {
                width: 100px;
                height: 5px;
                border-radius: 5px;
                background: #ddd;
                outline: none;
                -webkit-appearance: none;
            }
            
            .volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: #FFD700;
                cursor: pointer;
            }
            
            .volume-slider::-moz-range-thumb {
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: #FFD700;
                cursor: pointer;
                border: none;
            }
            
            .volume-label {
                color: white;
                font-weight: bold;
                min-width: 30px;
                text-align: center;
                font-size: 0.9em;
            }

            @media (max-width: 768px) {
                .bottom-controls {
                    margin-top: 20px;
                    padding: 15px;
                    gap: 12px;
                }

                .sound-controls {
                    padding: 10px 12px;
                    gap: 8px;
                }

                .admin-button {
                    width: 45px;
                    height: 45px;
                    font-size: 1.3em;
                }

                .performance-button {
                    width: 45px;
                    height: 45px;
                    font-size: 1.3em;
                    margin-left: 8px;
                }

                .volume-slider {
                    width: 80px;
                }
            }

            @media (max-width: 480px) {
                .bottom-controls {
                    margin-top: 15px;
                    padding: 12px;
                    gap: 10px;
                }

                .sound-controls {
                    padding: 8px 10px;
                    gap: 6px;
                }

                .volume-slider {
                    width: 60px;
                }

                .admin-button {
                    width: 40px;
                    height: 40px;
                    font-size: 1.2em;
                }

                .performance-button {
                    width: 40px;
                    height: 40px;
                    font-size: 1.2em;
                    margin-left: 6px;
                }

                .performance-control {
                    flex-direction: column;
                    gap: 5px;
                    margin-left: 6px;
                }

                .performance-label {
                    font-size: 0.8em;
                    padding: 4px 8px;
                    border-radius: 10px;
                }
            }
        `;
        document.head.appendChild(style);

        // Add admin button to bottom controls
        const adminButton = document.createElement('button');
        adminButton.className = 'admin-button';
        adminButton.title = 'Admin Access';
        adminButton.innerHTML = '🤫'; // Hush emoji
        adminButton.addEventListener('click', () => {
            if (window.showAdminLogin) {
                window.showAdminLogin();
            }
        });

        // Add performance mode button
        const performanceButton = document.createElement('button');
        performanceButton.className = 'performance-button';
        performanceButton.title = 'Performance Settings';
        performanceButton.innerHTML = '⚡'; // Lightning bolt emoji
        
        // Add performance mode label
        const performanceLabel = document.createElement('span');
        performanceLabel.className = 'performance-label';
        performanceLabel.id = 'performance-mode-label';
        
        // Create performance control container
        const performanceControl = document.createElement('div');
        performanceControl.className = 'performance-control';
        performanceControl.appendChild(performanceButton);
        performanceControl.appendChild(performanceLabel);
        
        console.log('🔧 Creating performance button...');
        
        performanceButton.addEventListener('click', () => {
            console.log('🔧 Performance button clicked!');
            console.log('🔍 Debug - modeSelectionModal available:', !!window.modeSelectionModal);
            
            // Wait for modal to be available if not ready yet
            const showModal = () => {
                if (window.modeSelectionModal) {
                    console.log('📋 Showing mode selection modal...');
                    window.modeSelectionModal.show().then((selectedMode) => {
                        console.log(`✅ Modal resolved with mode: ${selectedMode}`);
                        // Force update the label after modal closes
                        setTimeout(() => {
                            this.updatePerformanceModeLabel();
                        }, 500);
                    }).catch((error) => {
                        console.error('❌ Modal promise rejected:', error);
                    });
                } else {
                    console.warn('⏳ Modal not ready yet, waiting...');
                    // Try again after a short delay
                    setTimeout(() => {
                        if (window.modeSelectionModal) {
                            console.log('📋 Modal now available, showing...');
                            window.modeSelectionModal.show().then((selectedMode) => {
                                console.log(`✅ Modal resolved with mode: ${selectedMode}`);
                                setTimeout(() => {
                                    this.updatePerformanceModeLabel();
                                }, 500);
                            });
                        } else {
                            console.error('❌ Mode selection modal still not found after waiting!');
                            alert('Performance settings not available yet. Please try again in a moment.');
                        }
                    }, 100);
                }
            };
            
            showModal();
        });

        bottomControls.appendChild(soundControl);
        bottomControls.appendChild(adminButton);
        bottomControls.appendChild(performanceControl);
        
        console.log('🔧 Performance button added to DOM');
        
        // Initialize mode label
        this.updatePerformanceModeLabel();
        
        // Set up a periodic check to update the label (in case performanceManager loads later)
        setTimeout(() => {
            this.updatePerformanceModeLabel();
        }, 1000);
        
        setTimeout(() => {
            this.updatePerformanceModeLabel();
        }, 3000);

        // Add event listeners
        document.getElementById('muteButton').addEventListener('click', () => {
            this.toggleMute();
            this.playSound('click'); // Play click sound when toggling
        });

        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            this.setVolume(volume);
            this.playSound('click'); // Play click sound when adjusting
        });

        document.getElementById('testSoundButton').addEventListener('click', () => {
            console.log('Testing spin sound...');
            this.testSound('spin');
        });
    }

    // Update volume button appearance
    updateVolumeButton() {
        const button = document.getElementById('muteButton');
        if (button) {
            button.textContent = this.isMuted ? '🔇' : '🔊';
            button.classList.toggle('muted', this.isMuted);
        }
    }

    // Update volume slider and label
    updateVolumeSlider() {
        const slider = document.getElementById('volumeSlider');
        const label = document.querySelector('.volume-label');
        
        if (slider) {
            slider.value = this.volume * 100;
        }
        
        if (label) {
            label.textContent = Math.round(this.volume * 100) + '%';
        }
    }

    // Integration methods for slot machine events
    onSpinStart() {
        this.playSound('spin');
    }

    onReelStop() {
        this.playSound('reelStop');
    }

    onWin(isJackpot = false) {
        if (isJackpot) {
            this.playSound('jackpot');
        } else {
            this.playSound('win');
        }
    }

    onLose() {
        this.playSound('lose');
    }

    // Play congratulations sound for popup wins
    onPopupWin() {
        this.playCustomSound('congratulations');
    }

    // Play miaw sound for popup losses (default prize)
    onPopupLose() {
        this.playCustomSound('miaw');
    }

    // Play custom MP3 sounds with performance mode support
    playCustomSound(soundName) {
        if (this.isMuted || !this.customSounds || !this.customSounds[soundName]) {
            return;
        }

        // Check if sound should play based on performance mode
        if (!this.shouldPlaySound(soundName)) {
            return;
        }

        try {
            const audio = this.customSounds[soundName];
            
            // Performance mode optimizations
            if (this.performanceMode === 'performance') {
                // Mark as playing to prevent overlaps
                this.isPlayingCustomSound = true;
                
                // Shorter timeout for performance mode
                setTimeout(() => {
                    this.isPlayingCustomSound = false;
                }, 500); // Reduced from potential longer duration
                
                // Lower quality but faster loading
                audio.preload = 'metadata'; // Only load metadata, not entire file
            } else {
                // High quality mode - preload the entire file
                audio.preload = 'auto';
                
                // Track playing state with longer duration
                this.isPlayingCustomSound = true;
                setTimeout(() => {
                    this.isPlayingCustomSound = false;
                }, 2000);
            }
            
            audio.currentTime = 0; // Reset to beginning
            audio.volume = this.volume;
            
            // Performance mode uses immediate play, high quality mode can wait for load
            if (this.performanceMode === 'performance') {
                audio.play().catch(error => {
                    console.warn(`Could not play ${soundName} sound:`, error);
                    this.isPlayingCustomSound = false;
                });
            } else {
                // High quality mode - ensure audio is loaded before playing
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn(`Could not play ${soundName} sound:`, error);
                        this.isPlayingCustomSound = false;
                    });
                }
            }
        } catch (error) {
            console.warn(`Error playing custom sound ${soundName}:`, error);
            this.isPlayingCustomSound = false;
        }
    }

    // Stop all custom sounds
    stopCustomSounds() {
        if (!this.customSounds) {
            return;
        }

        try {
            Object.values(this.customSounds).forEach(audio => {
                if (audio && !audio.paused) {
                    audio.pause();
                    audio.currentTime = 0; // Reset to beginning
                }
            });
        } catch (error) {
            console.warn('Error stopping custom sounds:', error);
        }
    }

    // Update performance mode label
    updatePerformanceModeLabel() {
        const label = document.getElementById('performance-mode-label');
        console.log('🏷️ Updating performance label, element found:', !!label);
        
        if (!label) {
            console.warn('❌ Performance label element not found');
            return;
        }

        // Get current mode from performance manager
        let currentMode = 'high-quality'; // default
        let modeText = '🚀 High Quality';
        
        if (window.performanceManager && window.performanceManager.getMode) {
            const mode = window.performanceManager.getMode();
            console.log('🔍 Performance manager mode:', mode);
            
            if (mode === 'performance') {
                currentMode = 'performance';
                modeText = '⚡ Performance';
            } else if (mode === 'high-quality') {
                currentMode = 'high-quality';
                modeText = '🚀 High Quality';
            }
        } else {
            console.warn('❌ Performance manager not available for label update');
        }

        // Update label text and styling
        label.textContent = modeText;
        label.className = `performance-label ${currentMode}`;
        
        console.log(`✅ Performance label updated: ${modeText} (class: ${label.className})`);
    }

    onButtonClick() {
        this.playSound('click');
    }

    onBackgroundStart() {
        this.playSound('background');
    }

    // Debug function to test sounds
    testSound(soundName) {
        console.log(`Testing sound: ${soundName}`);
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('Audio context suspended, trying to resume...');
            this.audioContext.resume().then(() => {
                console.log('Audio context resumed');
                this.playSound(soundName);
            });
        } else {
            this.playSound(soundName);
        }
    }

    // Test all sounds (for debugging)
    testAllSounds() {
        const soundNames = ['click', 'spin', 'reelStop', 'win', 'lose', 'jackpot'];
        soundNames.forEach((sound, index) => {
            setTimeout(() => {
                console.log(`Testing ${sound}...`);
                this.testSound(sound);
            }, index * 1000);
        });
    }
}

// Global sound manager instance
// Initialize sound manager and load custom sounds
window.soundManager = new SoundManager();
window.soundManager.loadCustomSounds();
