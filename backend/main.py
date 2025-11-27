from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, database

# AI & Data Science Imports
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta

# 1. Initialize Database Tables
models.Base.metadata.create_all(bind=database.engine)

# 2. Initialize App
app = FastAPI(title="NexusRetail AI Backend")

# 3. CORS Configuration (Allows Frontend to talk to Backend)
# Update this section to allow all connections
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"  # <--- ADD THIS (Allows any website to connect)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 🛒 CORE ERP MODULES (Products & Sales)
# ==========================================

@app.post("/products/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(database.get_db)):
    # Check for duplicate SKU
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU already registered")
    
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/products/", response_model=List[schemas.Product])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Product).offset(skip).limit(limit).all()

@app.get("/products/{sku}", response_model=schemas.Product)
def read_product(sku: str, db: Session = Depends(database.get_db)):
    product = db.query(models.Product).filter(models.Product.sku == sku).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.post("/transactions/")
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(database.get_db)):
    total_val = 0.0
    
    # A. Validate Stock & Calculate Total
    for item in transaction.items:
        product = db.query(models.Product).filter(models.Product.sku == item.product_sku).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_sku} not found")
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}")
        
        total_val += (product.selling_price * item.quantity)

    # B. Create Transaction Header
    new_txn = models.Transaction(
        total_amount=total_val,
        payment_method=transaction.payment_method
    )
    db.add(new_txn)
    db.commit()
    db.refresh(new_txn)

    # C. Deduct Stock & Create Line Items
    for item in transaction.items:
        product = db.query(models.Product).filter(models.Product.sku == item.product_sku).first()
        
        # Deduct
        product.stock_quantity -= item.quantity
        
        # Record
        txn_item = models.TransactionItem(
            transaction_id=new_txn.id,
            product_sku=item.product_sku,
            quantity=item.quantity,
            price_at_sale=product.selling_price
        )
        db.add(txn_item)
    
    db.commit()
    
    return {"status": "success", "transaction_id": new_txn.id, "total": total_val}

# ==========================================
# 📈 AI FORECASTING ENGINE (Linear Regression)
# ==========================================

@app.get("/ai/predict/{sku}")
def predict_demand(sku: str, db: Session = Depends(database.get_db)):
    # 1. Fetch Sales History for SKU
    results = db.query(models.TransactionItem, models.Transaction)\
        .join(models.Transaction)\
        .filter(models.TransactionItem.product_sku == sku)\
        .all()
    
    # Need at least a few data points to draw a line
    if len(results) < 5:
        return {
            "sku": sku,
            "status": "insufficient_data",
            "predicted_weekly_demand": 0,
            "trend": "Unknown",
            "recommendation": "Collect more sales data"
        }

    # 2. Prepare Dataframe
    data = []
    for item, txn in results:
        data.append({"date": txn.timestamp, "qty": item.quantity})
    
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    
    # Group by Day
    daily_sales = df.groupby(df['date'].dt.date)['qty'].sum().reset_index()
    
    # 3. Feature Engineering (Date -> Day Number)
    start_date = pd.to_datetime(daily_sales['date'].min())
    daily_sales['day_index'] = (pd.to_datetime(daily_sales['date']) - start_date).dt.days
    
    X = daily_sales[['day_index']].values
    y = daily_sales['qty'].values

    # 4. Train Model
    model = LinearRegression()
    model.fit(X, y)

    # 5. Predict Next 7 Days
    last_day = daily_sales['day_index'].max()
    future_days = np.array([[last_day + i] for i in range(1, 8)])
    predictions = model.predict(future_days)
    
    # Sum up predictions (and ensure no negative sales)
    predicted_demand = int(sum([max(0, p) for p in predictions]))
    
    # 6. Generate Logic-Based Recommendation
    product = db.query(models.Product).filter(models.Product.sku == sku).first()
    
    trend_direction = "Growing" if model.coef_[0] > 0 else "Declining"
    
    recommendation = "Stock is Healthy"
    if product.stock_quantity < predicted_demand:
        shortfall = predicted_demand - product.stock_quantity
        recommendation = f"Order {shortfall} units"

    return {
        "sku": sku,
        "current_stock": product.stock_quantity,
        "predicted_weekly_demand": predicted_demand,
        "trend": trend_direction,
        "recommendation": recommendation
    }

# ==========================================
# 🤖 NEXUS AI AGENT (Chat & Navigation)
# ==========================================

@app.post("/ai/chat")
def chat_with_nexus(query: dict, db: Session = Depends(database.get_db)):
    user_text = query.get("text", "").lower()
    
    # Response Structure
    response = {
        "text": "",
        "action": None  # used by Frontend to switch tabs (e.g., 'NAVIGATE_POS')
    }

    # LOGIC 1: NAVIGATION COMMANDS
    if any(word in user_text for word in ["sell", "pos", "checkout", "register", "point of sale"]):
        response["text"] = "Opening the Point of Sale module for you now."
        response["action"] = "NAVIGATE_POS"
        return response
    
    if any(word in user_text for word in ["home", "dashboard", "menu", "main", "start"]):
        response["text"] = "Returning to the Main Dashboard."
        response["action"] = "NAVIGATE_DASHBOARD"
        return response

    # LOGIC 2: INVENTORY & DATA QUERIES
    if any(word in user_text for word in ["stock", "how many", "count", "inventory"]):
        count = db.query(models.Product).count()
        
        # Calculate total value of stock on hand
        products = db.query(models.Product).all()
        total_value = sum(p.cost_price * p.stock_quantity for p in products)
        
        response["text"] = (
            f"You currently have {count} unique products registered in the database. "
            f"The total cost value of your inventory is R {total_value:,.2f}."
        )
        return response

    # LOGIC 3: DEFAULT PROFESSIONAL GREETING
    response["text"] = (
        "I am Nexus, your Operations Assistant. "
        "I can help you check stock levels, navigate to the POS, or analyze sales trends. "
        "How may I assist you?"
    )
    return response