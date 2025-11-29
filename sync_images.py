import os
import cloudinary
import cloudinary.uploader
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
# We import your existing database models
from backend.main import Product, ProductImage, Base

# --- 1. CLOUDINARY CONFIGURATION (Pre-filled) ---
CLOUDINARY_CONFIG = {
    "cloud_name": "dgmge9fhg",
    "api_key":    "697813564863223",
    "api_secret": "LcHFZjn0Lbixu8YtCbhlqyov-9E"
}

# --- 2. LOCAL FOLDER CONFIGURATION (⚠️ YOU MUST EDIT THIS) ---
# Where are your images stored?
# Example: C:/Users/blikk/Pictures/ProductStock
# IMPORTANT: The folder names inside must match your Product Names exactly (e.g. "Coca Cola 500ml")
IMAGES_ROOT_DIR = r"C:\Users\blikk\Documents\Product images\downloads" 

# --- 3. DATABASE CONNECTION (⚠️ YOU MUST PASTE THIS) ---
# Paste the long string starting with 'postgres://' from Neon here.
DATABASE_URL = "postgresql://neondb_owner:npg_7fxIB3SGgUyR@ep-lucky-mud-ag2tc1ca-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" 

# Fix URL for Python (Postgres requirement)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connect to Database
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# --- MAIN ROBOT LOGIC ---
cloudinary.config(**CLOUDINARY_CONFIG)

def sync_images():
    print("🚀 Starting Image Sync Robot...")
    
    if not os.path.exists(IMAGES_ROOT_DIR):
        print(f"❌ Error: The folder '{IMAGES_ROOT_DIR}' does not exist.")
        print("   Please edit line 18 of this script with the real path.")
        return

    # Loop through every folder in your images directory
    for folder_name in os.listdir(IMAGES_ROOT_DIR):
        folder_path = os.path.join(IMAGES_ROOT_DIR, folder_name)
        
        if os.path.isdir(folder_path):
            print(f"📂 Scanning Product: {folder_name}...")
            
            # Find the Product in the Database (Match by Name OR SKU)
            product = db.query(Product).filter(
                (Product.name == folder_name) | (Product.sku == folder_name)
            ).first()
            
            if not product:
                print(f"   ⚠️ Skipping: '{folder_name}' not found in Database (Check spelling!)")
                continue

            # Loop through images inside that product folder
            for img_file in os.listdir(folder_path):
                if img_file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                    file_path = os.path.join(folder_path, img_file)
                    
                    # Check if we already uploaded this image to avoid duplicates
                    existing = db.query(ProductImage).filter(
                        ProductImage.product_sku == product.sku,
                        ProductImage.image_url.like(f"%{img_file.split('.')[0]}%")
                    ).first()
                    
                    if existing:
                        print(f"   ✓ Already Exists: {img_file}")
                        continue

                    print(f"   ☁️ Uploading to Cloud: {img_file}...")
                    try:
                        # Upload to Cloudinary
                        upload_result = cloudinary.uploader.upload(file_path, folder=f"nexus_retail/{folder_name}")
                        secure_url = upload_result["secure_url"]
                        
                        # Save link to Database
                        new_img = ProductImage(
                            product_sku=product.sku, 
                            image_url=secure_url,
                            is_primary=("cover" in img_file.lower() or "1" in img_file)
                        )
                        db.add(new_img)
                        db.commit()
                        print(f"     ✅ Linked to {product.name}")
                    except Exception as e:
                        print(f"     ❌ Upload Error: {e}")

    print("🏁 Sync Complete! Refresh your App.")

if __name__ == "__main__":
    sync_images()