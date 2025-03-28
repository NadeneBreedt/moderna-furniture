# Office Pro Scraper

This script scrapes product data from Office Pro's website and uploads it to Supabase, including product images.

## Setup

1. Create a Python virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file with your Supabase credentials (optional if using default credentials)

## Usage

Run the scraper:
```bash
python scraper.py
```

The script will:
1. Scrape all products from the configured categories
2. Download and save product images locally
3. Upload images to Supabase Storage
4. Create product entries in the Supabase database
5. Save progress in `scraped_products.json`

## Features

- Asynchronous scraping for better performance
- Progress tracking with tqdm
- Automatic image processing and optimization
- Error handling and logging
- Progress saving between categories
- Rate limiting to be nice to the server

## Notes

- The script includes reasonable delays between requests to avoid overwhelming the server
- Images are saved locally before being uploaded to Supabase
- Failed products are logged but won't stop the entire process
- The script can be stopped and resumed, picking up where it left off 