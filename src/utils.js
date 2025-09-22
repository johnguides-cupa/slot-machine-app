// Utility functions for path resolution and environment detection

// Detect if we're in development or production environment
function isDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Get the correct asset path for both development and production
export function getAssetPath(relativePath) {
    const basePath = isDevelopment() ? '' : '/slot-machine-app';
    return `${basePath}${relativePath}`;
}

// Get image asset path
export function getImagePath(imageName) {
    return getAssetPath(`/assets/images/${imageName}`);
}

// Get sound asset path
export function getSoundPath(soundName) {
    return getAssetPath(`/assets/sounds/${soundName}`);
}

// For backward compatibility with global access
window.getAssetPath = getAssetPath;
window.getImagePath = getImagePath;
window.getSoundPath = getSoundPath;
window.isDevelopment = isDevelopment;
