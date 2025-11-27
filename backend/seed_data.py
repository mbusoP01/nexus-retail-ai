import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# 1. Connect to Database
db = SessionLocal()

print("🌱 Seeding 60 Days of Sales History...")

# 2. Get the Product
product = db.query(models.Product).filter(models.Product.sku == "TEST-001").first()

if not product:
    print("❌ Error: Product 'TEST-001' not found. Please create it in Swagger first!")
else:
    # 3. Generate 60 Days of Fake Sales
    # We simulate a "Trending" product: Sales increase slightly over time.
    start_date = datetime.utcnow() - timedelta(days=60)
    
    total_sales = 0
    
    for i in range(60):
        current_date = start_date + timedelta(days=i)
        
        # Base sales: Random between 1 and 5
        # Trend: Add 0.1 extra sale per day (Simulating growth)
        # Seasonality: More sales on Fridays (Weekday 4)
        daily_qty = random.randint(1, 5) + int(i * 0.1)
        
        if current_date.weekday() == 4: # Friday boost
            daily_qty += 5
            
        if daily_qty > 0:
            # Create Transaction
            txn = models.Transaction(
                total_amount=daily_qty * product.selling_price,
                payment_method="CASH",
                timestamp=current_date
            )
            db.add(txn)
            db.commit()
            
            # Create Transaction Item
            item = models.TransactionItem(
                transaction_id=txn.id,
                product_sku=product.sku,
                quantity=daily_qty,
                price_at_sale=product.selling_price
            )
            db.add(item)
            total_sales += 1

    print(f"✅ Success! Created {total_sales} fake transactions for the AI to analyze.")

db.close()