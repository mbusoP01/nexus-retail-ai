import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from backend.main import Product, Base, Transaction, TransactionItem, ProductImage, Staff, Supplier

# --- CONFIGURATION ---
# Paste your Neon Database URL here (same as before)
DATABASE_URL = "postgresql://neondb_owner:npg_7fxIB3SGgUyR@ep-lucky-mud-ag2tc1ca-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" 

# File Names (Make sure these match exactly what is in your folder)
FILE_BARCODE = "VEL300 Barcoded stock.xlsx - Sheet1.csv"
FILE_OPENING = "VEL300 Opening Stock order Final V.xlsx - michel.csv"

# --- DB CONNECTION ---
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def wipe_database():
    print("⚠️  WIPING DATABASE (Removing old test data)...")
    try:
        # Delete children first to respect Foreign Keys
        db.query(ProductImage).delete()
        db.query(TransactionItem).delete()
        db.query(Transaction).delete()
        db.query(Product).delete()
        db.commit()
        print("✅ Database Wiped Clean.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error wiping DB: {e}")

def clean_currency(value):
    """Helper to turn 'R 1,200.50' into float 1200.50"""
    if pd.isna(value): return 0.0
    return float(str(value).replace('R', '').replace(',', '').replace(' ', '').strip())

def import_data():
    print("\n--- 📦 PHASE 1: LOADING BARCODED STOCK ---")
    try:
        df_barcode = pd.read_csv(FILE_BARCODE)
        # normalize headers
        df_barcode.columns = df_barcode.columns.str.strip().str.lower()
        print(f"   Found columns: {list(df_barcode.columns)}")
        
        count = 0
        for index, row in df_barcode.iterrows():
            # AUTO-MAPPING LOGIC (Adjust keys if your CSV is different)
            # We try to find columns like 'code', 'barcode', 'description', 'selling'
            sku = str(row.get('code') or row.get('barcode') or row.get('item code') or f"GEN-{index}")
            name = str(row.get('description') or row.get('item description') or "Unknown Item")
            price = clean_currency(row.get('selling') or row.get('price') or row.get('retail') or 0)
            category = str(row.get('category') or row.get('group') or "General")

            # Create Product
            product = Product(
                sku=sku,
                name=name,
                selling_price=price,
                cost_price=0,    # Will update in Phase 2
                stock_quantity=0, # Will update in Phase 2
                category=category
            )
            db.add(product)
            count += 1
        
        db.commit()
        print(f"✅ Phase 1 Complete: Created {count} products.")

    except Exception as e:
        print(f"❌ Phase 1 Error: {e}")

    print("\n--- 📦 PHASE 2: UPDATING OPENING STOCK & COSTS ---")
    try:
        df_opening = pd.read_csv(FILE_OPENING)
        df_opening.columns = df_opening.columns.str.strip().str.lower()
        print(f"   Found columns: {list(df_opening.columns)}")

        updates = 0
        for index, row in df_opening.iterrows():
            # Find the product we just created
            sku = str(row.get('code') or row.get('item code') or "UNKNOWN")
            
            product = db.query(Product).filter(Product.sku == sku).first()
            
            if product:
                # Update with real data
                cost = clean_currency(row.get('cost') or row.get('unit cost') or 0)
                qty = int(clean_currency(row.get('qty') or row.get('quantity') or row.get('count') or 0))
                
                product.cost_price = cost
                product.stock_quantity = qty
                updates += 1
            else:
                # Optional: Create items that were only in the Opening Stock file
                # print(f"   ⚠️ Item in Stock list but not Barcode list: {sku}")
                pass

        db.commit()
        print(f"✅ Phase 2 Complete: Updated {updates} products with Stock & Cost.")

    except Exception as e:
        print(f"❌ Phase 2 Error: {e}")

if __name__ == "__main__":
    confirm = input("This will DELETE ALL DATA. Type 'yes' to proceed: ")
    if confirm.lower() == "yes":
        wipe_database()
        import_data()
        print("\n🎉 IMPORT COMPLETE! Now run sync_images.py")
    else:
        print("Cancelled.")