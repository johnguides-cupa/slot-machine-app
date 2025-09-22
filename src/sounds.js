// webOS-optimized Sound Manager for Smart TV compatibility
class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.volume = 0.5;
        this.initializeSounds();
        this.createVolumeControl();
    }

    initializeSounds() {
        console.log('🔊 Initializing webOS-optimized audio system');
        this.loadCustomSounds();
        this.loadExternalSounds();
        this.createProgrammaticSounds();
    }

    // Load original external sounds with webOS optimization
    loadExternalSounds() {
        this.externalSounds = {};
        
        const externalUrls = {
            spin: 'https://www.soundjay.com/misc/sounds/slot-machine-spinning.wav',
            win: 'https://www.soundjay.com/misc/sounds/slot-machine-win.wav',
            lose: 'https://www.soundjay.com/misc/sounds/slot-machine-lose.wav',
            click: 'https://www.soundjay.com/misc/sounds/button-click.wav',
            reelStop: 'https://www.soundjay.com/misc/sounds/slot-reel-stop.wav',
            jackpot: 'https://www.soundjay.com/misc/sounds/jackpot.wav'
            // Note: background sound removed for webOS performance
        };

        Object.entries(externalUrls).forEach(([soundName, url]) => {
            try {
                const audio = new Audio(url);
                audio.volume = this.volume;
                audio.preload = 'auto';
                audio.crossOrigin = 'anonymous'; // Handle CORS
                
                // Test if sound can load (with timeout for webOS)
                const loadTimeout = setTimeout(() => {
                    console.warn(`⏰ External sound timeout: ${soundName}`);
                }, 5000); // 5 second timeout for TV networks
                
                audio.addEventListener('canplaythrough', () => {
                    clearTimeout(loadTimeout);
                    this.externalSounds[soundName] = audio;
                    console.log(`✅ External sound loaded: ${soundName}`);
                }, { once: true });
                
                audio.addEventListener('error', () => {
                    clearTimeout(loadTimeout);
                    console.warn(`❌ Failed to load external sound: ${soundName}`);
                }, { once: true });
                
                // Start loading
                audio.load();
                
            } catch (error) {
                console.warn(`Error setting up external sound ${soundName}:`, error);
            }
        });

        console.log('🔊 External sounds loading (with fallbacks) for webOS');
    }

    loadCustomSounds() {
        this.customSounds = {};
        
        try {
            const congratsAudio = new Audio('./assets/sounds/Congratulations.mp3');
            congratsAudio.volume = this.volume;
            congratsAudio.preload = 'auto';
            this.customSounds.congratulations = congratsAudio;
        } catch (error) {
            console.warn('Could not load congratulations sound:', error);
        }

        try {
            const miawAudio = new Audio('./assets/sounds/miaw.mp3');
            miawAudio.volume = this.volume;
            miawAudio.preload = 'auto';
            this.customSounds.miaw = miawAudio;
        } catch (error) {
            console.warn('Could not load miaw sound:', error);
        }

        console.log('🔊 Custom sounds loaded for webOS');
    }

    createProgrammaticSounds() {
        this.sounds = {
            spin: () => this.playRealisticSpinSound(),
            win: () => this.playSimpleBeep(600, 0.3),
            lose: () => this.playSimpleBeep(150, 0.8),
            click: () => this.playSimpleBeep(800, 0.1),
            reelStop: () => this.playSimpleBeep(400, 0.2),
            jackpot: () => this.playSimpleBeep(800, 1.0)
        };
        console.log('🔊 Programmatic fallback sounds created for webOS');
    }

    // Create a more realistic spinning sound like mechanical reels
    playRealisticSpinSound() {
        if (this.isMuted) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create multiple oscillators for a richer spinning sound
            const duration = 2.0; // Longer duration for spinning
            const frequencies = [120, 180, 240]; // Multiple frequencies for mechanical sound
            
            frequencies.forEach((baseFreq, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filterNode = audioContext.createBiquadFilter();
                
                // Connect the audio nodes
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Configure oscillator
                oscillator.type = 'sawtooth'; // More mechanical sound
                oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
                
                // Add frequency modulation for spinning effect
                oscillator.frequency.linearRampToValueAtTime(baseFreq * 1.5, audioContext.currentTime + duration * 0.3);
                oscillator.frequency.linearRampToValueAtTime(baseFreq * 0.8, audioContext.currentTime + duration);
                
                // Configure filter for more realistic sound
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(800, audioContext.currentTime);
                filterNode.frequency.linearRampToValueAtTime(400, audioContext.currentTime + duration);
                
                // Configure volume envelope
                const volume = this.volume * 0.15 * (1 - index * 0.3); // Different volumes for each layer
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime + duration * 0.7);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                // Start and stop
                oscillator.start(audioContext.currentTime + index * 0.05); // Slight delay between layers
                oscillator.stop(audioContext.currentTime + duration);
            });
            
            // Add some clicking sounds for mechanical reels
            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    this.playSimpleBeep(600 + Math.random() * 200, 0.05);
                }, i * 200);
            }
            
        } catch (error) {
            console.warn('Realistic spin sound failed on webOS:', error);
            // Fallback to simple beep
            this.playSimpleBeep(300, 0.5);
        }
    }

    playSimpleBeep(frequency, duration) {
        if (this.isMuted) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Simple beep failed on webOS:', error);
        }
    }

    playSound(soundName) {
        if (this.isMuted) return;

        // Priority 1: External sounds (original soundjay.com sounds)
        if (this.externalSounds && this.externalSounds[soundName]) {
            try {
                const audio = this.externalSounds[soundName];
                audio.currentTime = 0;
                audio.volume = this.volume;
                audio.play().catch(error => {
                    console.warn(`External sound play failed for ${soundName}, trying fallback:`, error);
                    this.playFallbackSound(soundName);
                });
                return;
            } catch (error) {
                console.warn(`Error playing external sound ${soundName}:`, error);
            }
        }

        // If external sound not available, try fallbacks
        this.playFallbackSound(soundName);
    }

    // Play fallback sounds (custom MP3s or programmatic)
    playFallbackSound(soundName) {
        // Priority 2: Custom sounds (local MP3 files)
        if (this.customSounds && this.customSounds[soundName]) {
            try {
                const audio = this.customSounds[soundName];
                audio.currentTime = 0;
                audio.play();
                return;
            } catch (error) {
                console.warn(`Error playing custom sound ${soundName}:`, error);
            }
        }

        // Priority 3: Programmatic sounds (Web Audio API fallback)
        if (this.sounds && this.sounds[soundName]) {
            try {
                this.sounds[soundName]();
            } catch (error) {
                console.warn(`Failed to play programmatic sound ${soundName}:`, error);
            }
        } else {
            console.warn(`Sound ${soundName} not found in any sound source`);
        }
    }

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
        
        // Update external sounds volume
        if (this.externalSounds) {
            Object.values(this.externalSounds).forEach(audio => {
                if (audio && typeof audio.volume !== 'undefined') {
                    audio.volume = this.volume;
                }
            });
        }
        
        // Update custom sounds volume
        if (this.customSounds) {
            Object.values(this.customSounds).forEach(audio => {
                if (audio && typeof audio.volume !== 'undefined') {
                    audio.volume = this.volume;
                }
            });
        }
        
        this.updateVolumeSlider();
    }

    // Stop all currently playing sounds
    stopAllSounds() {
        // Stop external sounds
        if (this.externalSounds) {
            Object.values(this.externalSounds).forEach(audio => {
                if (audio && !audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        }
        
        // Stop custom sounds
        if (this.customSounds) {
            Object.values(this.customSounds).forEach(audio => {
                if (audio && !audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        }
        
        console.log('🔇 All sounds stopped');
    }

    createVolumeControl() {
        let bottomControls = document.querySelector('.bottom-controls');
        if (!bottomControls) {
            bottomControls = document.createElement('div');
            bottomControls.className = 'bottom-controls';
            document.body.appendChild(bottomControls);
        }

        const soundControl = document.createElement('div');
        soundControl.className = 'sound-control';

        const soundControls = document.createElement('div');
        soundControls.className = 'sound-controls';

        const muteButton = document.createElement('button');
        muteButton.id = 'muteButton';
        muteButton.className = 'mute-button';
        muteButton.innerHTML = '🔊';
        muteButton.title = 'Toggle Mute';

        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.id = 'volumeSlider';
        volumeSlider.className = 'volume-slider';
        volumeSlider.min = '0';
        volumeSlider.max = '1';
        volumeSlider.step = '0.1';
        volumeSlider.value = this.volume;

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

            .mute-button {
                background: none;
                border: none;
                font-size: 1.5em;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                transition: all 0.3s ease;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .mute-button:hover {
                background: rgba(255,255,255,0.1);
                transform: scale(1.1);
            }

            .volume-slider {
                width: 100px;
                height: 8px;
                background: #ddd;
                border-radius: 5px;
                outline: none;
                opacity: 0.7;
                transition: opacity 0.2s;
            }

            .volume-slider:hover {
                opacity: 1;
            }

            .volume-slider::-webkit-slider-thumb {
                appearance: none;
                width: 16px;
                height: 16px;
                background: #FFD700;
                cursor: pointer;
                border-radius: 50%;
            }

            .volume-slider::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: #FFD700;
                cursor: pointer;
                border-radius: 50%;
                border: none;
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
                color: #FFD700;
            }

            .admin-button:hover {
                background: rgba(255,215,0,0.2);
                transform: scale(1.1);
                box-shadow: 0 0 10px rgba(255,215,0,0.5);
            }

            .admin-button:focus {
                outline: 3px solid #FFD700;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);

        soundControls.appendChild(muteButton);
        soundControls.appendChild(volumeSlider);
        soundControl.appendChild(soundControls);

        // Add admin button optimized for webOS TV
        const adminButton = document.createElement('button');
        adminButton.className = 'admin-button';
        adminButton.title = 'Admin Access';
        adminButton.innerHTML = '⚙️'; // Settings gear emoji for webOS
        adminButton.addEventListener('click', () => {
            if (window.showAdminLogin) {
                window.showAdminLogin();
            }
        });

        bottomControls.appendChild(soundControl);
        bottomControls.appendChild(adminButton);

        muteButton.addEventListener('click', () => {
            this.toggleMute();
        });

        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(parseFloat(e.target.value));
        });

        console.log('🔊 Volume control created');
    }

    updateVolumeButton() {
        const muteButton = document.getElementById('muteButton');
        if (muteButton) {
            muteButton.innerHTML = this.isMuted ? '🔇' : '🔊';
        }
    }

    updateVolumeSlider() {
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.value = this.volume;
        }
    }

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

    onPopupWin() {
        if (this.customSounds.congratulations) {
            this.playSound('congratulations');
        } else {
            this.playSound('win');
        }
    }

    onPopupLose() {
        if (this.customSounds.miaw) {
            this.playSound('miaw');
        } else {
            this.playSound('lose');
        }
    }

    onButtonClick() {
        this.playSound('click');
    }
}

window.soundManager = new SoundManager();
console.log('🔊 webOS-optimized sound system initialized');