// Loading Screen Component with Progress Bar
export class LoadingScreen {
    constructor() {
        this.container = null;
        this.progressBar = null;
        this.progressText = null;
        this.statusText = null;
        this.loadingAnimation = null;
    }

    // Create and show the loading screen
    show() {
        this.createLoadingHTML();
        this.startLoadingAnimation();
        document.body.appendChild(this.container);
    }

    // Update progress bar and text
    updateProgress(percentage, loaded, total) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
        
        if (this.progressText) {
            this.progressText.textContent = `${Math.round(percentage)}%`;
        }
        
        if (this.statusText) {
            // Show different messages based on progress
            let message = '';
            if (percentage < 25) {
                message = `Loading prize images... ${loaded}/${total}`;
            } else if (percentage < 50) {
                message = `Loading app assets... ${loaded}/${total}`;
            } else if (percentage < 75) {
                message = `Preparing slot machine... ${loaded}/${total}`;
            } else if (percentage < 100) {
                message = `Finalizing setup... ${loaded}/${total}`;
            } else {
                message = `Ready to play! ${loaded}/${total}`;
            }
            this.statusText.textContent = message;
        }
    }

    // Hide and remove the loading screen
    hide() {
        if (this.loadingAnimation) {
            clearInterval(this.loadingAnimation);
        }
        
        if (this.container) {
            // Smooth fade out animation
            this.container.style.transition = 'opacity 0.5s ease-out';
            this.container.style.opacity = '0';
            
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
            }, 500);
        }
    }

    // Create the loading screen HTML and styles
    createLoadingHTML() {
        this.container = document.createElement('div');
        this.container.id = 'asset-loading-screen';
        this.container.innerHTML = `
            <div class="loading-content">
                <div class="loading-logo">
                    <div class="slot-spinner">
                        <div class="spinner-reel">🎰</div>
                        <div class="spinner-reel">🎯</div>
                        <div class="spinner-reel">⭐</div>
                    </div>
                </div>
                
                <h1 class="loading-title">Pursuing Potential</h1>
                <h2 class="loading-subtitle">Slot Machine</h2>
                
                <div class="loading-progress">
                    <div class="progress-container">
                        <div class="progress-bar-bg">
                            <div class="progress-bar" id="progress-bar"></div>
                            <div class="progress-shine"></div>
                        </div>
                        <div class="progress-text" id="progress-text">0%</div>
                    </div>
                    <div class="status-text" id="status-text">Initializing...</div>
                </div>
                
                <div class="loading-tips">
                    <p>🎲 Preparing your gaming experience...</p>
                </div>
            </div>
        `;

        // Add styles
        this.addLoadingStyles();
        
        // Get references to elements
        this.progressBar = this.container.querySelector('#progress-bar');
        this.progressText = this.container.querySelector('#progress-text');
        this.statusText = this.container.querySelector('#status-text');
    }

    // Add CSS styles for the loading screen
    addLoadingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #asset-loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, #3C1366 50%, #8128E7 50%, #3C1366 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                font-family: 'Open Sans', sans-serif;
                color: white;
                opacity: 1;
                transition: opacity 0.5s ease-out;
            }

            .loading-content {
                text-align: center;
                max-width: 500px;
                padding: 40px;
            }

            .loading-logo {
                margin-bottom: 30px;
            }

            .slot-spinner {
                display: flex;
                justify-content: center;
                gap: 10px;
                font-size: 3em;
                margin-bottom: 20px;
            }

            .spinner-reel {
                animation: spinReel 2s linear infinite;
                display: inline-block;
            }

            .spinner-reel:nth-child(2) {
                animation-delay: 0.3s;
            }

            .spinner-reel:nth-child(3) {
                animation-delay: 0.6s;
            }

            @keyframes spinReel {
                0% { transform: rotateY(0deg); }
                100% { transform: rotateY(360deg); }
            }

            .loading-title {
                font-family: 'Value Serif', serif;
                font-size: 2.5em;
                font-weight: 700;
                margin: 0 0 10px 0;
                color: #FFD700;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                letter-spacing: 2px;
            }

            .loading-subtitle {
                font-family: 'Value Serif', serif;
                font-size: 1.5em;
                font-weight: 600;
                margin: 0 0 40px 0;
                color: #00FFFF;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                letter-spacing: 1px;
            }

            .loading-progress {
                margin: 30px 0;
            }

            .progress-container {
                position: relative;
                margin-bottom: 15px;
            }

            .progress-bar-bg {
                width: 100%;
                height: 25px;
                background: rgba(0,0,0,0.3);
                border-radius: 15px;
                border: 2px solid #F49E06;
                overflow: hidden;
                position: relative;
                box-shadow: 
                    inset 0 2px 4px rgba(0,0,0,0.3),
                    0 2px 8px rgba(244,158,6,0.3);
            }

            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, 
                    #FFD700 0%, 
                    #F49E06 50%, 
                    #FFD700 100%
                );
                border-radius: 13px;
                width: 0%;
                transition: width 0.3s ease-out;
                position: relative;
                box-shadow: 
                    0 0 15px rgba(255,215,0,0.6),
                    inset 0 2px 4px rgba(255,255,255,0.3);
            }

            .progress-shine {
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, 
                    transparent, 
                    rgba(255,255,255,0.4), 
                    transparent
                );
                animation: progressShine 2s ease-in-out infinite;
            }

            @keyframes progressShine {
                0% { left: -100%; }
                50% { left: 100%; }
                100% { left: 100%; }
            }

            .progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-weight: bold;
                font-size: 0.9em;
                color: #2c3e50;
                text-shadow: 1px 1px 0px rgba(255,255,255,0.5);
                z-index: 10;
            }

            .status-text {
                font-size: 1.1em;
                color: #8EE8D8;
                font-weight: 600;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                margin-bottom: 20px;
            }

            .loading-tips {
                margin-top: 30px;
                opacity: 0.8;
            }

            .loading-tips p {
                font-size: 1em;
                color: #D4ADFF;
                margin: 5px 0;
                font-style: italic;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .loading-content {
                    padding: 20px;
                    max-width: 90%;
                }
                
                .loading-title {
                    font-size: 2em;
                }
                
                .loading-subtitle {
                    font-size: 1.2em;
                }
                
                .slot-spinner {
                    font-size: 2.5em;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Start loading animation effects
    startLoadingAnimation() {
        let dotCount = 0;
        this.loadingAnimation = setInterval(() => {
            if (this.statusText && this.statusText.textContent.includes('Loading assets')) {
                dotCount = (dotCount + 1) % 4;
                const dots = '.'.repeat(dotCount);
                const baseText = this.statusText.textContent.split('...')[0].split('..')[0].split('.')[0];
                this.statusText.textContent = baseText + dots;
            }
        }, 500);
    }
}

// Export singleton instance
export const loadingScreen = new LoadingScreen();