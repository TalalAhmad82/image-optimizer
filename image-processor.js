document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const editorContainer = document.getElementById('editorContainer');
    const originalPreview = document.getElementById('originalPreview');
    const optimizedPreview = document.getElementById('optimizedPreview');
    const originalInfo = document.getElementById('originalInfo');
    const optimizedInfo = document.getElementById('optimizedInfo');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const maintainAspectRatio = document.getElementById('maintainAspectRatio');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const formatSelect = document.getElementById('formatSelect');
    const applyChangesBtn = document.getElementById('applyChangesBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // New DOM Elements for background removal and image adjustments
    const removeBackground = document.getElementById('removeBackground');
    const backgroundColorContainer = document.getElementById('backgroundColorContainer');
    const backgroundColorPicker = document.getElementById('backgroundColorPicker');
    const backgroundImageContainer = document.getElementById('backgroundImageContainer');
    const backgroundImageInput = document.getElementById('backgroundImageInput');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const brightnessValue = document.getElementById('brightnessValue');
    const contrastSlider = document.getElementById('contrastSlider');
    const contrastValue = document.getElementById('contrastValue');
    const sharpnessSlider = document.getElementById('sharpnessSlider');
    const sharpnessValue = document.getElementById('sharpnessValue');

    // Variables to store image data
    let originalImage = null;
    let optimizedImage = null;
    let originalWidth = 0;
    let originalHeight = 0;
    let aspectRatio = 0;
    let currentQuality = 80;
    let currentFormat = 'jpeg';
    
    // Variables for background removal and image adjustments
    let backgroundRemoved = false;
    let customBackgroundColor = '#ffffff';
    let customBackgroundImage = null;
    let currentBrightness = 0;
    let currentContrast = 0;
    let currentSharpness = 0;
    let backgroundImageObj = null;

    // Check if we're on the tool page
    if (!uploadArea) return;

    // Initialize event listeners
    initEventListeners();

    function initEventListeners() {
        // File upload via click
        imageInput.addEventListener('change', handleFileSelect);

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleFileDrop);
        uploadArea.addEventListener('click', () => imageInput.click());

        // Control inputs
        if (widthInput) {
            widthInput.addEventListener('input', handleDimensionChange);
            widthInput.addEventListener('change', processImage);
        }
        if (heightInput) {
            heightInput.addEventListener('input', handleDimensionChange);
            heightInput.addEventListener('change', processImage);
        }
        if (qualitySlider) {
            qualitySlider.addEventListener('input', () => {
                currentQuality = qualitySlider.value;
                qualityValue.textContent = `${currentQuality}%`;
                processImage(); // Process image immediately when quality changes
            });
        }
        if (formatSelect) {
            formatSelect.addEventListener('change', () => {
                currentFormat = formatSelect.value;
                processImage(); // Process image immediately when format changes
            });
        }
        
        // Background removal and replacement controls
        if (removeBackground) {
            removeBackground.addEventListener('change', () => {
                backgroundRemoved = removeBackground.checked;
                backgroundColorContainer.style.display = backgroundRemoved ? 'flex' : 'none';
                backgroundImageContainer.style.display = backgroundRemoved ? 'flex' : 'none';
                processImage(); // Process image immediately when background removal is toggled
            });
        }
        
        if (backgroundColorPicker) {
            backgroundColorPicker.addEventListener('input', () => {
                customBackgroundColor = backgroundColorPicker.value;
                processImage(); // Process image immediately when background color changes
            });
        }
        
        if (backgroundImageInput) {
            backgroundImageInput.addEventListener('change', handleBackgroundImageSelect);
        }
        
        // Image adjustment controls
        if (brightnessSlider) {
            brightnessSlider.addEventListener('input', () => {
                currentBrightness = brightnessSlider.value;
                brightnessValue.textContent = currentBrightness;
                processImage(); // Process image immediately when brightness changes
            });
        }
        
        if (contrastSlider) {
            contrastSlider.addEventListener('input', () => {
                currentContrast = contrastSlider.value;
                contrastValue.textContent = currentContrast;
                processImage(); // Process image immediately when contrast changes
            });
        }
        
        if (sharpnessSlider) {
            sharpnessSlider.addEventListener('input', () => {
                currentSharpness = sharpnessSlider.value;
                sharpnessValue.textContent = currentSharpness;
                processImage(); // Process image immediately when sharpness changes
            });
        }

        // Buttons
        if (applyChangesBtn) {
            // Hide the Apply Changes button as changes are applied automatically
            applyChangesBtn.style.display = 'none';
        }
        if (downloadBtn) downloadBtn.addEventListener('click', downloadImage);
        if (resetBtn) resetBtn.addEventListener('click', resetTool);
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
    }

    function handleFileDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        uploadArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            imageInput.files = e.dataTransfer.files;
            handleFileSelect(e);
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0] || e.dataTransfer.files[0];
        
        if (!file) return;
        
        // Check if file is an image
        if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/gif') && !file.type.match('image/webp')) {
            alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            // Create image object
            originalImage = new Image();
            originalImage.onload = function() {
                // Store original dimensions
                originalWidth = originalImage.width;
                originalHeight = originalImage.height;
                aspectRatio = originalWidth / originalHeight;
                
                // Set initial values for width and height inputs
                widthInput.value = originalWidth;
                heightInput.value = originalHeight;
                
                // Display original image
                displayOriginalImage();
                
                // Process image with default settings
                processImage();
                
                // Show editor container
                uploadArea.style.display = 'none';
                editorContainer.style.display = 'block';
                
                // Enable the download button immediately after processing
                downloadBtn.disabled = false;
            };
            originalImage.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    }

    function handleDimensionChange(e) {
        if (!maintainAspectRatio.checked) return;
        
        if (e.target === widthInput && widthInput.value) {
            heightInput.value = Math.round(widthInput.value / aspectRatio);
        } else if (e.target === heightInput && heightInput.value) {
            widthInput.value = Math.round(heightInput.value * aspectRatio);
        }
    }

    function displayOriginalImage() {
        // Clear previous content
        originalPreview.innerHTML = '';
        
        // Create a clone of the original image for display
        const displayImg = originalImage.cloneNode();
        originalPreview.appendChild(displayImg);
        
        // Update info
        const fileSizeKB = Math.round(getImageFileSize(originalImage.src) / 1024);
        originalInfo.innerHTML = `
            <p>Dimensions: ${originalWidth} × ${originalHeight}px</p>
            <p>Size: ${fileSizeKB} KB</p>
        `;
    }

    // Handle background image selection
    function handleBackgroundImageSelect(e) {
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Check if file is an image
        if (!file.type.match('image.*')) {
            alert('Please select a valid image file');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            // Create image object for background
            backgroundImageObj = new Image();
            backgroundImageObj.onload = function() {
                customBackgroundImage = backgroundImageObj;
                processImage(); // Process image with new background
            };
            backgroundImageObj.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    }
    
    // Apply background removal using color 
    function removeImageBackground(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Simple background removal algorithm (green screen effect)
        // This is a simplified version - a real implementation would use more sophisticated algorithms
        for (let i = 0; i < data.length; i += 4) {
            // Get pixel color values
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel is likely to be background (simplified approach)
            // This uses a simple brightness threshold - edges of objects may not be perfect
            const brightness = (r + g + b) / 3;
            if (brightness > 240) { // Assuming white/light background
                data[i + 3] = 0; // Set alpha to transparent
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Apply image adjustments (brightness, contrast, sharpness)
    function applyImageAdjustments(ctx, width, height) {
        // Get the image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Convert slider values to usable ranges
        const brightness = currentBrightness * 2.55; // -255 to 255
        const contrast = (currentContrast / 100 + 1); // 0 to 2
        const sharpness = currentSharpness / 100; // 0 to 1
        
        // Apply brightness and contrast
        for (let i = 0; i < data.length; i += 4) {
            // Apply brightness
            data[i] = Math.min(255, Math.max(0, data[i] + brightness));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
            
            // Apply contrast
            data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * contrast) + 128));
            data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * contrast) + 128));
            data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * contrast) + 128));
        }
        
        // Apply sharpness (simplified  masking)
        if (sharpness > 0) {
            // Create a blurred version for  masking
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Draw the original image
            tempCtx.putImageData(imageData, 0, 0);
            
            // Apply blur (simplified)
            tempCtx.filter = 'blur(1px)';
            tempCtx.drawImage(tempCanvas, 0, 0);
            tempCtx.filter = 'none';
            
            // Get the blurred image data
            const blurredData = tempCtx.getImageData(0, 0, width, height).data;
            
            // Apply  mask
            for (let i = 0; i < data.length; i += 4) {
                // Calculate the difference and apply sharpening
                data[i] = Math.min(255, Math.max(0, data[i] + (data[i] - blurredData[i]) * sharpness));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + (data[i + 1] - blurredData[i + 1]) * sharpness));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + (data[i + 2] - blurredData[i + 2]) * sharpness));
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    function processImage() {
        if (!originalImage) return;
        
        // Get current settings
        const width = parseInt(widthInput.value) || originalWidth;
        const height = parseInt(heightInput.value) || originalHeight;
        const quality = currentQuality / 100;
        const format = currentFormat;
        
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Get the canvas context
        const ctx = canvas.getContext('2d');
        
        // If background removal is enabled and we have a custom background
        if (backgroundRemoved) {
            // First, fill with the selected background color
            ctx.fillStyle = customBackgroundColor;
            ctx.fillRect(0, 0, width, height);
            
            // If a custom background image is selected, draw it first
            if (customBackgroundImage) {
                // Draw the background image, scaling it to fit
                ctx.drawImage(customBackgroundImage, 0, 0, width, height);
            }
            
            // Create a temporary canvas for the foreground image with transparency
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Draw the original image on the temporary canvas
            tempCtx.drawImage(originalImage, 0, 0, width, height);
            
            // Remove the background from the temporary canvas
            removeImageBackground(tempCtx, width, height);
            
            // Draw the foreground (with transparent background) onto the main canvas
            ctx.drawImage(tempCanvas, 0, 0);
        } else {
            // Just draw the original image with new dimensions
            ctx.drawImage(originalImage, 0, 0, width, height);
        }
        
        // Apply image adjustments (brightness, contrast, sharpness)
        applyImageAdjustments(ctx, width, height);
        
        // Convert to desired format with quality setting
        let mimeType;
        switch (format) {
            case 'jpeg':
                mimeType = 'image/jpeg';
                break;
            case 'png':
                mimeType = 'image/png';
                break;
            case 'webp':
                mimeType = 'image/webp';
                break;
            default:
                mimeType = 'image/jpeg';
        }
        
        let optimizedDataUrl = canvas.toDataURL(mimeType, quality);
        
        // Display optimized image
        displayOptimizedImage(optimizedDataUrl, width, height);
    }

    function displayOptimizedImage(dataUrl, width, height) {
        // Clear previous content
        optimizedPreview.innerHTML = '';
        
        // Create and display optimized image
        optimizedImage = new Image();
        optimizedImage.onload = function() {
            optimizedPreview.appendChild(optimizedImage);
            
            // Update info
            const fileSizeKB = Math.round(getImageFileSize(dataUrl) / 1024);
            const originalSizeKB = Math.round(getImageFileSize(originalImage.src) / 1024);
            const reduction = Math.round(((originalSizeKB - fileSizeKB) / originalSizeKB) * 100);
            
            optimizedInfo.innerHTML = `
                <p>Dimensions: ${width} × ${height}px</p>
                <p>Size: ${fileSizeKB} KB (${reduction}% smaller)</p>
            `;
        };
        optimizedImage.src = dataUrl;
    }

    function downloadImage() {
        if (!optimizedImage) return;
        
        // Create download link
        const link = document.createElement('a');
        link.download = `optimized-image.${currentFormat}`;
        link.href = optimizedImage.src;
        link.click();
    }

    function resetTool() {
        // Reset all inputs and images
        imageInput.value = '';
        widthInput.value = '';
        heightInput.value = '';
        qualitySlider.value = 80;
        qualityValue.textContent = '80%';
        formatSelect.value = 'jpeg';
        
        // Reset variables
        originalImage = null;
        optimizedImage = null;
        originalWidth = 0;
        originalHeight = 0;
        aspectRatio = 0;
        currentQuality = 80;
        currentFormat = 'jpeg';
        
        // Clear previews
        originalPreview.innerHTML = '';
        optimizedPreview.innerHTML = '';
        originalInfo.innerHTML = '';
        optimizedInfo.innerHTML = '';
        
        // Show upload area, hide editor
        uploadArea.style.display = 'block';
        editorContainer.style.display = 'none';
    }

    // Helper function to calculate image file size from data URL
    function getImageFileSize(dataUrl) {
        // Remove metadata from data URL to get only the base64 string
        const base64 = dataUrl.split(',')[1];
        const paddingFactor = dataUrl.indexOf('base64,') > -1 ? 0.75 : 1;
        const size = Math.floor((base64.length * paddingFactor));
        return size;
    }
});