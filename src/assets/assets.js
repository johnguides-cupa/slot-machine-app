// Assets manifest for prize images
export const PRIZE_ASSETS = [
  {
    id: 'cambridge-shield',
    name: 'Cambridge Shield',
    filename: 'Cambridge Shield.png',
    path: '/slot-machine-app/assets/images/prizes/Cambridge%20Shield.png',
    description: 'Cambridge Shield logo'
  },
  {
    id: 'development-evp-shield',
    name: 'Development EVP Shield',
    filename: 'Development-EVP-shield.png',
    path: '/slot-machine-app/assets/images/prizes/Development-EVP-shield.png',
    description: 'Development EVP shield logo'
  },
  {
    id: 'inclusion-evp-shield',
    name: 'Inclusion EVP Shield',
    filename: 'Inclusion-EVP-shield.png',
    path: '/slot-machine-app/assets/images/prizes/Inclusion-EVP-shield.png',
    description: 'Inclusion EVP shield logo'
  },
  {
    id: 'innovation-evp-shield',
    name: 'Innovation EVP Shield',
    filename: 'Innovation-EVP-shield.png',
    path: '/slot-machine-app/assets/images/prizes/Innovation-EVP-shield.png',
    description: 'Innovation EVP shield logo'
  },
  {
    id: 'pursuing-potential-logo',
    name: 'Pursuing Potential Logo',
    filename: 'Pursuing Potential Logo.png',
    path: '/slot-machine-app/assets/images/prizes/Pursuing%20Potential%20Logo.png',
    description: 'Pursuing Potential brand logo'
  }
];

// Special app images (not prizes but used throughout the app)
export const APP_IMAGES = {
  sadCat: {
    id: 'sad-cat',
    name: 'Sad Cat',
    filename: 'Sad_cat.png',
    path: './assets/images/Sad_cat.png',
    description: 'Default fallback image for failed loads'
  },
  winnerCat: {
    id: 'winner-cat',
    name: 'Winner Cat',
    filename: 'cat_win.png',
    path: './assets/images/cat_win.png',
    description: 'Victory celebration image'
  },
  logo: {
    id: 'pursuing-potential-header',
    name: 'Pursuing Potential Header Logo',
    filename: 'Pursuing Potential Logo.png',
    path: './assets/images/Pursuing Potential Logo.png',
    description: 'Main header logo'
  }
};

// Helper function to get asset URL for Vite
export const getAssetUrl = (filename) => {
  // URL encode the filename to handle spaces
  const encodedFilename = encodeURIComponent(filename);
  
  // Include the base path for assets
  return `/slot-machine-app/assets/images/prizes/${encodedFilename}`;
};
