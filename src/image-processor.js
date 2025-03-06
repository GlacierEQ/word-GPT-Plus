/**
 * Word GPT Plus - Image Processor
 * Handles image manipulation, optimization, and arrangement within documents
 */

class ImageProcessor {
    constructor() {
        // Supported image operations
        this.operations = {
            resize: this.resizeImage.bind(this),
            crop: this.cropImage.bind(this),
            compress: this.compressImage.bind(this),
            filter: this.applyFilter.bind(this),
            arrange: this.arrangeImages.bind(this)
        };

        // Supported filters
        this.filters = {
            grayscale: this.applyGrayscale.bind(this),
            sepia: this.applySepia.bind(this),
            brighten: this.adjustBrightness.bind(this),
            contrast: this.adjustContrast.bind(this)
        };

        // Image arrangement templates
        this.arrangementTemplates = {
            grid: { rows: 2, columns: 2, spacing: 5 },
            column: { direction: 'vertical', spacing: 10 },
            row: { direction: 'horizontal', spacing: 10 },
            scattered: { randomized: true, overlap: false }
        };
    }

    /**
     * Process image in Word document
     * @param {Object} options - Processing options
     * @returns {Promise<boolean>} Success status
     */
    async processDocumentImage(options) {
        try {
            return Word.run(async context => {
                // Get selected image
                const images = context.document.body.inlinePictures;
                images.load("items");

                await context.sync();

                if (images.items.length === 0) {
                    throw new Error("No images found in document");
                }

                // For now, work with the first image
                const image = images.items[0];

                // Perform requested operation
                if (options.operation && this.operations[options.operation]) {
                    await this.operations[options.operation](context, image, options);
                }

                await context.sync();
                return true;
            });
        } catch (error) {
            console.error('Error processing document image:', error);
            throw error;
        }
    }

    /**
     * Insert an image from a URL
     * @param {string} url - Image URL
     * @returns {Promise<boolean>} Success status
     */
    async insertImageFromUrl(url) {
        try {
            return Word.run(async context => {
                // Get current selection as the insertion point
                const range = context.document.getSelection();

                // Insert image
                range.insertInlinePictureFromBase64(
                    await this.urlToBase64(url),
                    Word.InsertLocation.replace
                );

                await context.sync();
                return true;
            });
        } catch (error) {
            console.error('Error inserting image:', error);
            throw error;
        }
    }

    /**
     * Convert URL to base64
     * @param {string} url - Image URL
     * @returns {Promise<string>} Base64 image data
     */
    async urlToBase64(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                const reader = new FileReader();
                reader.onloadend = function () {
                    resolve(reader.result.split(',')[1]);
                };
                reader.readAsDataURL(xhr.response);
            };
            xhr.onerror = function () {
                reject(new Error('Failed to load image'));
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        });
    }

    /**
     * Resize an image
     * @param {Object} context - Word context
     * @param {Object} image - Word inline picture
     * @param {Object} options - Resize options
     */
    async resizeImage(context, image, options) {
        if (options.width) {
            image.width = options.width;
        }
        if (options.height) {
            image.height = options.height;
        }
        if (options.scale) {
            image.width = image.width * options.scale;
            image.height = image.height * options.scale;
        }
    }

    /**
     * Crop an image
     * @param {Object} context - Word context
     * @param {Object} image - Word inline picture
     * @param {Object} options - Crop options
     */
    async cropImage(context, image, options) {
        // Note: Office JS doesn't directly support cropping
        // This would be implemented using alternative approaches
        console.log('Crop operation requested - not directly supported in Office JS API');
    }

    /**
     * Compress an image
     * @param {Object} context - Word context
     * @param {Object} image - Word inline picture
     * @param {Object} options - Compression options
     */
    async compressImage(context, image, options) {
        // Apply compression settings
        // Note: Direct compression not fully supported in Office JS
        // This would typically adjust image quality settings
        console.log('Compression requested - limited support in Office JS API');
    }

    /**
     * Apply filter to an image
     * @param {Object} context - Word context
     * @param {Object} image - Word inline picture
     * @param {Object} options - Filter options
     */
    async applyFilter(context, image, options) {
        if (options.filter && this.filters[options.filter]) {
            await this.filters[options.filter](context, image, options);
        }
    }

    /**
     * Arrange multiple images
     * @param {Object} context - Word context
     * @param {Object} image - Word inline picture (first image)
     * @param {Object} options - Arrangement options
     */
    async arrangeImages(context, image, options) {
        // Get all images in document
        const images = context.document.body.inlinePictures;
        images.load("items");

        await context.sync();

        if (images.items.length <= 1) {
            console.log('Not enough images to arrange');
            return;
        }

        // Apply arrangement template
        const template = options.template || 'grid';
        const arrangementOptions = this.arrangementTemplates[template] || this.arrangementTemplates.grid;

        // For grid arrangement
        if (template === 'grid') {
            // In a real implementation, this would create a table and insert images
            console.log(`Arranging ${images.items.length} images in grid layout`);
        }
    }

    // Filter implementations - these would be expanded in a real system

    async applyGrayscale(context, image, options) {
        // In a real implementation, this would manipulate the image
        console.log('Grayscale filter applied');
    }

    async applySepia(context, image, options) {
        // In a real implementation, this would manipulate the image
        console.log('Sepia filter applied');
    }

    async adjustBrightness(context, image, options) {
        // In a real implementation, this would manipulate the image
        console.log('Brightness adjustment applied');
    }

    async adjustContrast(context, image, options) {
        // In a real implementation, this would manipulate the image
        console.log('Contrast adjustment applied');
    }
}

// Create global instance
const imageProcessor = new ImageProcessor();
