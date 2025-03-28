import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://rpncvcioutyrxntqvlnd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTgxNzIsImV4cCI6MjA1NDg3NDE3Mn0.Rm4cDLV4cNubgwDV3SgLt2cC5E3fO4JOuXoK0DrKrzQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Product {
    id: number;
    name: string;
    image_url: string | null;
}

type ImageMap = {
    [key: string]: string;
};

// Function to scan directories and build image mapping
function buildImageMap(): ImageMap {
    const imageMap: ImageMap = {};
    const baseDir = path.join(process.cwd(), 'images');
    const categories = ['Chairs', 'Desking', 'Soft Seating', 'Storage', 'Pods'];

    for (const category of categories) {
        const categoryPath = path.join(baseDir, category);
        if (!fs.existsSync(categoryPath)) continue;

        // Read category directory
        const items = fs.readdirSync(categoryPath);
        for (const item of items) {
            const itemPath = path.join(categoryPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isDirectory()) {
                // Check for images in subdirectory
                const images = fs.readdirSync(itemPath).filter(file => 
                    file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')
                );
                
                if (images.length > 0) {
                    // Use directory name as product name
                    const productName = item;
                    // Use first image found
                    imageMap[productName] = `${category}/${item}/${images[0]}`;
                }
            } else if (stats.isFile() && (item.endsWith('.png') || item.endsWith('.jpg') || item.endsWith('.jpeg'))) {
                // Handle images directly in category folder
                const productName = path.parse(item).name;
                imageMap[productName] = `${category}/${item}`;
            }
        }
    }

    return imageMap;
}

async function updateProductImages() {
    console.log('Starting image update process...');

    // Build image mapping from directory structure
    console.log('Building image mapping from directories...');
    const imageMap = buildImageMap();
    console.log(`Found ${Object.keys(imageMap).length} image mappings`);

    // Get all products
    const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, image_url');

    if (fetchError) {
        console.error('Error fetching products:', fetchError);
        return;
    }

    if (!products) {
        console.error('No products found');
        return;
    }

    console.log(`Found ${products.length} products to process`);

    // Update each product's image URL
    for (const product of products) {
        // Try exact match first
        let imageFilename = imageMap[product.name];
        
        // If no exact match, try to find a close match
        if (!imageFilename) {
            const possibleMatch = Object.keys(imageMap).find(key => 
                key.toLowerCase().includes(product.name.toLowerCase()) ||
                product.name.toLowerCase().includes(key.toLowerCase())
            );
            if (possibleMatch) {
                imageFilename = imageMap[possibleMatch];
            }
        }
        
        if (imageFilename) {
            console.log(`Updating image for "${product.name}" to "${imageFilename}"`);
            
            const { error: updateError } = await supabase
                .from('products')
                .update({ image_url: imageFilename })
                .eq('id', product.id);

            if (updateError) {
                console.error(`Error updating image for "${product.name}":`, updateError);
            } else {
                console.log(`Successfully updated image for "${product.name}"`);
            }
        } else {
            console.log(`No image mapping found for "${product.name}"`);
        }
    }

    console.log('Image update process completed');
}

// Run the update
updateProductImages().catch(err => {
    console.error('Script error:', err);
});