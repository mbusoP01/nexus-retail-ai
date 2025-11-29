import os
import cloudinary
import cloudinary.uploader
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main import Product, ProductImage, Base

# --- 1. CLOUDINARY CONFIGURATION (Paste keys here) ---
CLOUDINARY_CONFIG = {
    "cloud_name": "dgmge9fhg",
    "api_key":    "697813564863223",
    "api_secret": "LcHFZjn0Lbixu8YtCbhlqyov-9E"
}

# --- 2. LOCAL FOLDER CONFIGURATION ---
# Example: C:/Users/blikk/Pictures/ProductStock
IMAGES_ROOT_DIR = r"C:\Users\blikk\Documents\Product images\downloads" 

# --- 3. DATABASE CONNECTION ---
# Paste your Neon PostgreSQL connection string here
DATABASE_URL = "postgresql://neondb_owner:npg_7fxIB3SGgUyR@ep-lucky-mud-ag2tc1ca-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" 

# Fix URL for Python
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connect to Database
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# --- MAIN ROBOT LOGIC ---
cloudinary.config(**CLOUDINARY_CONFIG)

def sync_images():
    print("🚀 Starting Image Sync Robot (Match by Filename)...")
    
    if not os.path.exists(IMAGES_ROOT_DIR):
        print(f"❌ Error: Folder '{IMAGES_ROOT_DIR}' not found.")
        return

    # Loop through the Group Folders (e.g., "B10. FILTER BOXES")
    for group_folder in os.listdir(IMAGES_ROOT_DIR):
        folder_path = os.path.join(IMAGES_ROOT_DIR, group_folder)
        
        if os.path.isdir(folder_path):
            print(f"📂 Entering Group: {group_folder}...")

            # Loop through images inside the group
            for img_file in os.listdir(folder_path):
                if img_file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                    
                    # 1. Get Product Name from Filename (Remove .jpg)
                    # Example: "Zodiac Valve.jpg" -> "Zodiac Valve"
                    product_name_from_file = os.path.splitext(img_file)[0]
                    
                    # 2. Find Product in DB
                    product = db.query(Product).filter(
                        (Product.name == product_name_from_file) | 
                        (Product.sku == product_name_from_file)
                    ).first()
                    
                    if not product:
                        # Optional: Print skipped items (can be noisy if names don't match exactly)
                        # print(f"   ⚠️ Skipping image: '{img_file}' - No matching product in DB.")
                        continue

                    # 3. Check if already uploaded
                    existing = db.query(ProductImage).filter(
                        ProductImage.product_sku == product.sku,
                        ProductImage.image_url.like(f"%{product_name_from_file}%")
                    ).first()
                    
                    if existing:
                        print(f"   ✓ Exists: {product.name}")
                        continue

                    # 4. Upload!
                    print(f"   ☁️ Found Match! Uploading: {img_file} -> {product.name}...")
                    try:
                        file_path = os.path.join(folder_path, img_file)
                        
                        # Upload to Cloudinary
                        upload_result = cloudinary.uploader.upload(file_path, folder=f"nexus_retail/{group_folder}")
                        secure_url = upload_result["secure_url"]
                        
                        # Save to DB
                        new_img = ProductImage(
                            product_sku=product.sku, 
                            image_url=secure_url,
                            is_primary=True # Since we match by filename, this is likely the main image
                        )
                        db.add(new_img)
                        db.commit()
                        print(f"     ✅ Linked successfully!")
                    except Exception as e:
                        print(f"     ❌ Upload Error: {e}")

    print("🏁 Sync Complete!")

if __name__ == "__main__":
    sync_images()