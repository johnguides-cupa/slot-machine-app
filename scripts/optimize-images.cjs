// webOS Image Optimization Script
// This script provides recommendations for optimizing images for Smart TV performance

const fs = require('fs');
const path = require('path');

class ImageOptimizer {
    constructor() {
        this.maxSizeKB = 500; // 500KB max for webOS
        this.maxWidth = 1920;  // TV resolution width
        this.maxHeight = 1080; // TV resolution height
        this.recommendedFormats = ['webp', 'jpeg', 'png'];
        
        this.assetsDir = path.join(__dirname, '..', 'public', 'assets', 'images');
    }

    // Analyze current images and provide optimization recommendations
    analyzeImages() {
        console.log('🔍 webOS Image Analysis Starting...\n');
        
        this.scanDirectory(this.assetsDir);
        
        console.log('\n📋 webOS Optimization Recommendations:');
        console.log('1. 🎯 Keep images under 500KB for optimal TV performance');
        console.log('2. 📺 Max resolution: 1920x1080 (Smart TV standard)');
        console.log('3. 🖼️  Use WebP format when possible (smaller file sizes)');
        console.log('4. ⚡ Consider progressive JPEG for large images');
        console.log('5. 🔄 Use responsive images with srcset for different TV sizes');
        
        console.log('\n🛠️  Optimization Tools:');
        console.log('• Online: tinypng.com, squoosh.app');
        console.log('• CLI: imagemin, sharp, webp-converter');
        console.log('• Build process: Add image optimization to Vite config');
    }

    // Recursively scan directory for images
    scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                console.log(`📁 Scanning: ${path.relative(this.assetsDir, fullPath)}/`);
                this.scanDirectory(fullPath);
            } else if (this.isImageFile(item)) {
                this.analyzeImage(fullPath);
            }
        });
    }

    // Check if file is an image
    isImageFile(filename) {
        const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
        const ext = path.extname(filename).toLowerCase();
        return imageExtensions.includes(ext);
    }

    // Analyze individual image file
    analyzeImage(filePath) {
        const stat = fs.statSync(filePath);
        const sizeKB = Math.round(stat.size / 1024);
        const filename = path.basename(filePath);
        const relativePath = path.relative(this.assetsDir, filePath);
        
        console.log(`\n📷 ${relativePath}`);
        console.log(`   Size: ${sizeKB}KB`);
        
        // Size recommendations
        if (sizeKB > this.maxSizeKB) {
            const reductionNeeded = Math.round(((sizeKB - this.maxSizeKB) / sizeKB) * 100);
            console.log(`   ⚠️  TOO LARGE! Reduce by ~${reductionNeeded}% (target: ${this.maxSizeKB}KB)`);
            console.log(`   💡 Suggestions:`);
            console.log(`      • Compress with tinypng.com or squoosh.app`);
            console.log(`      • Convert to WebP format`);
            console.log(`      • Resize if larger than 1920x1080`);
        } else if (sizeKB > this.maxSizeKB * 0.8) {
            console.log(`   ⚡ Could optimize: Consider reducing size for faster TV loading`);
        } else {
            console.log(`   ✅ Good size for webOS Smart TV`);
        }
        
        // Format recommendations
        const ext = path.extname(filename).toLowerCase();
        if (ext === '.png' && sizeKB > 200) {
            console.log(`   💡 Consider converting PNG to WebP for ${Math.round(sizeKB * 0.3)}KB savings`);
        }
        if (ext === '.jpg' || ext === '.jpeg') {
            console.log(`   💡 Consider WebP conversion for ~25% size reduction`);
        }
    }

    // Generate optimization commands (for manual execution)
    generateOptimizationCommands() {
        console.log('\n🔧 Image Optimization Commands (run manually):');
        console.log('\n# Install optimization tools:');
        console.log('npm install -g imagemin-cli imagemin-webp imagemin-mozjpeg imagemin-pngquant');
        
        console.log('\n# Optimize all PNG files:');
        console.log('imagemin "public/assets/images/**/*.png" --out-dir="public/assets/images/optimized" --plugin=pngquant');
        
        console.log('\n# Convert to WebP:');
        console.log('imagemin "public/assets/images/**/*.{jpg,jpeg,png}" --out-dir="public/assets/images/webp" --plugin=webp');
        
        console.log('\n# Optimize JPEG files:');
        console.log('imagemin "public/assets/images/**/*.{jpg,jpeg}" --out-dir="public/assets/images/optimized" --plugin=mozjpeg');
    }
}

// Run the analyzer
const optimizer = new ImageOptimizer();
optimizer.analyzeImages();
optimizer.generateOptimizationCommands();

console.log('\n🎯 webOS Image Optimization Analysis Complete!');
console.log('💡 Tip: Run this script after adding new images to check optimization needs.\n');