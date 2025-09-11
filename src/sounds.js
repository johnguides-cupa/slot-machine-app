// Sound manager for the slot machine app
class SoundManager {
    constructor() {
        this.sounds = {};
        this.audioContext = null;
        this.isMuted = false;
        this.volume = 0.5; // Default volume 50%
        this.initializeSounds();
        this.createVolumeControl();
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

    // Load custom MP3 sound files
    loadCustomSounds() {
        this.customSounds = {};
        
        // Load congratulations sound
        const congratsAudio = new Audio('./assets/sounds/Congratulations.mp3');
        congratsAudio.volume = this.volume;
        this.customSounds.congratulations = congratsAudio;

        // Load miaw sound
        const miawAudio = new Audio('./assets/sounds/miaw.mp3');
        miawAudio.volume = this.volume;
        this.customSounds.miaw = miawAudio;

        // Handle loading errors gracefully
        congratsAudio.addEventListener('error', () => {
            console.warn('Could not load congratulations sound');
        });

        miawAudio.addEventListener('error', () => {
            console.warn('Could not load miaw sound');
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

    // Create a realistic spinning sound
    createSpinSound() {
        if (!this.audioContext || this.isMuted) return;

        // Create a spinning wheel sound effect
        const duration = 2.5; // Longer duration for spinning
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

        // Volume envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);

        // Add some clicking sounds to simulate mechanical reels
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.createTone(600 + Math.random() * 200, 0.05, 'square');
            }, i * 300);
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

    // Create ambient background sound
    createAmbientSound() {
        if (!this.audioContext || this.isMuted) return;

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

    // Play specific sound
    playSound(soundName) {
        if (this.sounds[soundName] && !this.isMuted) {
            try {
                // Resume audio context if it's suspended (browser autoplay policy)
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        this.sounds[soundName]();
                    }).catch(error => {
                        console.warn('Failed to resume audio context:', error);
                    });
                } else {
                    this.sounds[soundName]();
                }
            } catch (error) {
                console.warn('Error playing sound:', error);
            }
        } else if (this.isMuted) {
            console.log(`Sound ${soundName} muted`);
        } else {
            console.warn(`Sound ${soundName} not found`);
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
        this.updateVolumeSlider();
    }

    // Create volume control UI
    createVolumeControl() {
        const controlPanel = document.querySelector('.control-panel');
        if (!controlPanel) return;

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

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .sound-control {
                margin-top: 15px;
                display: flex;
                justify-content: center;
            }
            
            .sound-controls {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(0,0,0,0.3);
                padding: 10px;
                border-radius: 8px;
                border: 2px solid #FFD700;
            }
            
            .mute-button {
                background: none;
                border: none;
                font-size: 1.5em;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.2s ease;
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
        `;
        document.head.appendChild(style);

        controlPanel.appendChild(soundControl);

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

    // Play custom MP3 sounds
    playCustomSound(soundName) {
        if (this.isMuted || !this.customSounds || !this.customSounds[soundName]) {
            return;
        }

        try {
            const audio = this.customSounds[soundName];
            audio.currentTime = 0; // Reset to beginning
            audio.volume = this.volume;
            audio.play().catch(error => {
                console.warn(`Could not play ${soundName} sound:`, error);
            });
        } catch (error) {
            console.warn(`Error playing custom sound ${soundName}:`, error);
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
