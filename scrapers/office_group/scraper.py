import requests
from bs4 import BeautifulSoup
import time
from supabase import create_client
import os
import re
from urllib.parse import urlparse
from pathlib import Path
import mimetypes
from difflib import SequenceMatcher

# Supabase configuration
SUPABASE_URL = "https://rpncvcioutyrxntqvlnd.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbmN2Y2lvdXR5cnhudHF2bG5kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTI5ODE3MiwiZXhwIjoyMDU0ODc0MTcyfQ.7Lk25rLcb5V-PItj8pp3YORvLC7OcgREkUUW2CyLctw"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Constants
BASE_URL = "https://officegroup.co.za"
TEMP_IMAGE_DIR = "temp_images"

# Category mappings with URLs and their corresponding Supabase category IDs
CATEGORIES = {
    # Original categories
    '/office-furniture/office-desks/executive-desks': 16,        # Executive Desk
    '/office-furniture/office-desks/general-desks': 7,          # Desking
    '/office-furniture/office-desks/cluster-desks': 7,          # Desking
    '/office-furniture/office-desks/training-room': 413,        # Training
    '/office-furniture/office-chairs': 10,                      # Office Chairs
    '/office-furniture/reception-area/reception-counters': 17,  # Reception Counters
    '/office-furniture/reception-area/couches': 9,             # Couches
    '/office-furniture/boardroom/boardroom-tables': 15,        # Boardroom
    
    # New categories
    '/office-furniture/coffee-tables': 407,                     # Coffee Tables
    '/office-furniture/storage/wall-units': 408,               # Wall Units
    '/office-furniture/accessories/hat-stands': 409,           # Hat Stand
    '/office-furniture/storage/steel-furniture': 411,          # Steel Furniture
    '/office-furniture/training-furniture': 413,               # Training
    '/office-furniture/accessories/coat-stands': 414,          # Hat and Coat Stand
}

def normalize_product_name(name):
    """Normalize product name for comparison"""
    if not name:
        return ""
    # Convert to lowercase
    name = name.lower()
    # Remove common words that don't affect uniqueness
    common_words = [
        'range', 'series', 'collection', 'furniture', 'office', 'the', 
        'with', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of',
        'a', 'an', 'by', 'from', 'unit', 'style', 'type', 'model',
        'size', 'color', 'finish', 'design'
    ]
    for word in common_words:
        name = re.sub(r'\b' + word + r'\b', '', name)
    # Remove special characters and extra spaces
    name = re.sub(r'[^a-z0-9]', ' ', name)
    # Remove extra whitespace
    name = ' '.join(name.split())
    return name

def get_existing_products():
    """Get existing products from Supabase"""
    response = supabase.table('products').select('id,name,image_url').execute()
    return response.data

def is_similar_name(name1, name2):
    """Check if two product names are similar using various methods"""
    # Normalize both names
    norm1 = normalize_product_name(name1)
    norm2 = normalize_product_name(name2)
    
    # Direct match after normalization
    if norm1 == norm2:
        return True
        
    # Check word overlap
    words1 = set(norm1.split())
    words2 = set(norm2.split())
    if words1 and words2:
        overlap = len(words1 & words2)
        shorter_len = min(len(words1), len(words2))
        if shorter_len > 0 and overlap / shorter_len >= 0.6:  # 60% word overlap
            return True
            
    # Check sequence similarity
    similarity = SequenceMatcher(None, norm1, norm2).ratio()
    if similarity >= 0.6:  # 60% character sequence similarity
        return True
        
    return False

def is_duplicate_product(title, existing_products):
    """Check if product is a duplicate"""
    for existing in existing_products:
        if is_similar_name(title, existing['name']):
            return True, existing
    return False, None

def download_image(url, product_name):
    """Download image and return local path"""
    if not url:
        return None
        
    try:
        # Create temp directory if it doesn't exist
        os.makedirs(TEMP_IMAGE_DIR, exist_ok=True)
        
        # Clean up URL if needed
        url = url.split('?')[0]  # Remove query parameters
        
        # Get file extension from URL or default to .jpg
        parsed_url = urlparse(url)
        ext = os.path.splitext(parsed_url.path)[1].lower()
        if not ext or ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
            content_type = requests.head(url, headers=get_headers(), timeout=10).headers.get('content-type', '')
            if 'image' in content_type:
                ext = mimetypes.guess_extension(content_type) or '.jpg'
            else:
                ext = '.jpg'
            
        # Create safe filename
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', product_name)
        filename = f"{safe_name}{ext}"
        local_path = os.path.join(TEMP_IMAGE_DIR, filename)
        
        # Download image with timeout
        response = requests.get(url, headers=get_headers(), timeout=10)
        if response.status_code == 200 and 'image' in response.headers.get('content-type', ''):
            with open(local_path, 'wb') as f:
                f.write(response.content)
            return local_path
            
    except Exception as e:
        print(f"Error downloading image {url}: {e}")
        if os.path.exists(local_path):
            os.remove(local_path)
            
    return None

def get_headers():
    return {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

def process_images(image_url, gallery_urls, product_name):
    """Process main image and gallery images"""
    processed_urls = []
    
    # Process main image
    if image_url:
        local_path = download_image(image_url, f"{product_name}_main")
        if local_path:
            supabase_url = upload_to_supabase_storage(local_path, product_name)
            if supabase_url:
                processed_urls.append(supabase_url)
                
    # Process gallery images
    for i, gallery_url in enumerate(gallery_urls or []):
        local_path = download_image(gallery_url, f"{product_name}_gallery_{i}")
        if local_path:
            supabase_url = upload_to_supabase_storage(local_path, f"{product_name}_gallery_{i}")
            if supabase_url:
                processed_urls.append(supabase_url)
                
    return processed_urls[0] if processed_urls else None, processed_urls[1:] if len(processed_urls) > 1 else []

def upload_to_supabase_storage(local_path, product_name):
    """Upload image to Supabase storage and return public URL"""
    try:
        if not local_path or not os.path.exists(local_path):
            return None
            
        # Create safe filename for Supabase
        filename = os.path.basename(local_path)
        safe_name = re.sub(r'[^a-zA-Z0-9.]', '_', filename)
        
        # Upload to Supabase storage
        with open(local_path, 'rb') as f:
            supabase.storage.from_('moderna').upload(
                f'office_group/{safe_name}',
                f.read(),
                {'content-type': mimetypes.guess_type(local_path)[0]}
            )
            
        # Get public URL
        public_url = supabase.storage.from_('moderna').get_public_url(f'office_group/{safe_name}')
        
        # Clean up local file
        os.remove(local_path)
        
        return public_url
        
    except Exception as e:
        print(f"Error uploading image for {product_name}: {e}")
        if local_path and os.path.exists(local_path):
            os.remove(local_path)
        return None

def scrape_product_page(url):
    """Scrape individual product page"""
    try:
        response = requests.get(url, headers=get_headers(), timeout=10)
        if response.status_code != 200:
            print(f"Failed to fetch product page: {url}")
            return None
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get product details
        title = soup.find('h1', class_='product_title')
        if not title:
            title = soup.find('h2', class_='woocommerce-loop-product__title')
        title = title.text.strip() if title else None
        
        # Get description
        desc_elem = soup.find('div', class_='woocommerce-product-details__short-description')
        if not desc_elem:
            desc_elem = soup.find('div', class_='description')
        description = desc_elem.text.strip() if desc_elem else None
        
        # Get main image
        img_elem = soup.find('div', class_='woocommerce-product-gallery__image')
        if not img_elem:
            img_elem = soup.find('img', class_='wp-post-image')
        image_url = img_elem.find('img')['src'] if img_elem and img_elem.find('img') else None
        if not image_url and img_elem:
            image_url = img_elem.get('src')
        
        # Get gallery images
        gallery = []
        gallery_elems = soup.find_all('div', class_='woocommerce-product-gallery__image')
        if gallery_elems:
            gallery = [img.find('img')['src'] for img in gallery_elems if img.find('img')]
            
        if title:
            # Process and upload images
            main_image_url, gallery_urls = process_images(image_url, gallery, title)
            
            return {
                'name': title,
                'description': description,
                'image_url': main_image_url,
                'gallery_images': gallery_urls,
                'source_url': url,
                'source_site': 'Office Group'
            }
        return None
        
    except Exception as e:
        print(f"Error scraping product page {url}: {e}")
        return None

def scrape_category(category_url, category_name):
    """Scrape products from a category page"""
    existing_products = get_existing_products()
    new_products = []
    page = 1
    
    while True:
        url = f"{BASE_URL}{category_url}"
        if page > 1:
            url = f"{url}/page/{page}"
        print(f"\nScraping {url}")
        
        try:
            response = requests.get(url, headers=get_headers(), timeout=10)
            if response.status_code != 200:
                print(f"Failed to fetch page: {url}")
                break
                
            soup = BeautifulSoup(response.text, 'html.parser')
            products = soup.find_all(['li', 'div'], class_=['product', 'product-item'])
            
            if not products:
                print("No products found on page")
                break
                
            for product in products:
                title = product.find(['h2', 'h3', 'h4'], class_=['woocommerce-loop-product__title', 'product-title'])
                if not title:
                    continue
                    
                title_text = title.text.strip()
                is_duplicate, existing_product = is_duplicate_product(title_text, existing_products)
                
                if is_duplicate:
                    print(f"Skipping similar product: {title_text} (similar to existing: {existing_product['name']})")
                    continue
                
                product_url = product.find('a')['href'] if product.find('a') else None
                if product_url:
                    print(f"Scraping new product: {title_text}")
                    product_data = scrape_product_page(product_url)
                    if product_data:
                        new_products.append(product_data)
                        # Add to existing products to prevent duplicates within same run
                        existing_products.append({
                            'name': product_data['name'],
                            'id': None,
                            'image_url': product_data['image_url']
                        })
                        
                time.sleep(1)  # Be nice to the server
                
            # Check if there's a next page
            next_page = soup.find('a', class_='next')
            if not next_page:
                print("No next page found")
                break
                
            page += 1
            
        except Exception as e:
            print(f"Error scraping category page {url}: {e}")
            break
            
    return new_products

def save_to_supabase(products, category_id):
    """Save products to Supabase"""
    for product in products:
        try:
            # Check if product exists one final time before saving
            is_duplicate, existing_product = is_duplicate_product(product['name'], get_existing_products())
            if is_duplicate:
                print(f"Product {product['name']} was added by another process, skipping...")
                continue
                
            # Insert product
            result = supabase.table('products').insert({
                'name': product['name'],
                'description': product['description'],
                'image_url': product['image_url'],
                'gallery_images': product['gallery_images']
            }).execute()
            
            product_id = result.data[0]['id']
            
            # Insert category relationship
            supabase.table('product_categories').insert({
                'product_id': product_id,
                'category_id': category_id
            }).execute()
            
            print(f"Saved product: {product['name']}")
            
        except Exception as e:
            print(f"Error saving product {product['name']}: {e}")

def main():
    """Main function"""
    print("Starting Office Group scraper...")
    
    # Create directory for Office Group if it doesn't exist
    os.makedirs('scrapers/office_group', exist_ok=True)
    
    total_new_products = 0
    
    # Scrape each category
    for category_url, category_id in CATEGORIES.items():
        print(f"\nScraping category: {category_url}")
        
        products = scrape_category(category_url, category_url)
        if products:
            print(f"\nFound {len(products)} new products in {category_url}")
            save_to_supabase(products, category_id)
            total_new_products += len(products)
            
    print(f"\nScraping completed! Found {total_new_products} new products total.")

if __name__ == "__main__":
    main() 