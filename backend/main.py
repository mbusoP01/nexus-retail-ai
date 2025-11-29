import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship, joinedload # <-- ADDED joinedloadfrom typing import List, Optional
from pydantic import BaseModel
from typing import List, Optional
import datetime
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# --- CONFIGURATION ---
GOOGLE_CLIENT_ID = "499075396456-25b2eqf24q74fp84v0gr7bivsudhit3l.apps.googleusercontent.com"

# --- SECURITY CONFIGURATION ---
MANAGER_EMAILS = [
    "mbusophiri01@gmail.com",
    "nombusophiri8@gmail.com",
    "mbalaniphiri76@gmail.com"
]

ADMIN_USER = "Velcrest_Admin"
ADMIN_PASS_1 = "Velcrest.08@"
ADMIN_PASS_2 = "Sobahle08!!"

# --- DATABASE SETUP ---
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nexus_v2.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- MODELS ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    picture = Column(String)
    role = Column(String, default="Viewer")
    is_active = Column(Boolean, default=True)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    name = Column(String)
    cost_price = Column(Float)
    selling_price = Column(Float)
    stock_quantity = Column(Integer, default=0)
    category = Column(String)
    
    # NEW: Link to Images
    images = relationship("ProductImage", back_populates="product")

# --- NEW TABLE: PRODUCT IMAGES ---
class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True, index=True)
    product_sku = Column(String, ForeignKey("products.sku"))
    image_url = Column(String)
    is_primary = Column(Boolean, default=False)
    
    product = relationship("Product", back_populates="images")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(Float)
    payment_method = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    items = relationship("TransactionItem", back_populates="transaction")

class TransactionItem(Base):
    __tablename__ = "transaction_items"
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    product_sku = Column(String)
    quantity = Column(Integer)
    price_at_sale = Column(Float)
    transaction = relationship("Transaction", back_populates="items")

class Staff(Base):
    __tablename__ = "staff"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    role = Column(String)
    passcode = Column(String)

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    contact_email = Column(String)
    phone = Column(String)

Base.metadata.create_all(bind=engine)

# --- SCHEMAS ---
class TokenSchema(BaseModel):
    credential: str

class AdminLoginSchema(BaseModel):
    username: str
    password: str

class ProductCreate(BaseModel):
    sku: str; name: str; cost_price: float; selling_price: float; stock_quantity: int; category: str

class TransactionItemCreate(BaseModel):
    product_sku: str; quantity: int

class TransactionCreate(BaseModel):
    payment_method: str; items: List[TransactionItemCreate]

class StaffCreate(BaseModel):
    name: str; role: str; passcode: str

class SupplierCreate(BaseModel):
    name: str; contact_email: str; phone: str

class StockUpdate(BaseModel):
    quantity: int

# --- APP ---
app = FastAPI(title="NexusRetail Final Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# --- 1. AUTH ENDPOINTS ---
@app.post("/auth/login")
def login_with_google(token: TokenSchema, db: Session = Depends(get_db)):
    try:
        id_info = id_token.verify_oauth2_token(token.credential, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = id_info['email']
        role = "Viewer"
        if email.lower() in [e.lower() for e in MANAGER_EMAILS]: role = "Manager"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, full_name=id_info.get('name'), picture=id_info.get('picture'), role=role)
            db.add(user); db.commit(); db.refresh(user)
        else:
            if user.role != role and role == "Manager": user.role = role; db.commit()
        return {"status": "success", "user": {"email": user.email, "name": user.full_name, "picture": user.picture, "role": user.role}}
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google Token")

@app.post("/auth/admin-login")
def login_as_admin(creds: AdminLoginSchema):
    if creds.username == ADMIN_USER and (creds.password == ADMIN_PASS_1 or creds.password == ADMIN_PASS_2):
        return {"status": "success", "user": {"email": "admin@velcrest.com", "name": "Velcrest Admin", "picture": "", "role": "Manager"}}
    raise HTTPException(status_code=401, detail="Invalid Credentials")

# --- 2. PRODUCT ENDPOINTS ---
@app.post("/products/")
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    if db.query(Product).filter(Product.sku == product.sku).first(): raise HTTPException(status_code=400, detail="SKU exists")
    db.add(Product(**product.dict())); db.commit(); return {"status": "created"}

@app.get("/products/")
def read_products(db: Session = Depends(get_db)):
    # FIX: Use joinedload to force the database to pull the images in the same query
    return db.query(Product).options(joinedload(Product.images)).all()

@app.put("/products/{sku}/stock")
def update_stock(sku: str, stock: StockUpdate, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.sku == sku).first()
    if p: p.stock_quantity = stock.quantity; db.commit()
    return {"status": "updated"}

# --- 3. TRANSACTION ENDPOINTS ---
@app.post("/transactions/")
def create_transaction(txn: TransactionCreate, db: Session = Depends(get_db)):
    total = 0.0
    for item in txn.items:
        p = db.query(Product).filter(Product.sku == item.product_sku).first()
        if not p: raise HTTPException(status_code=404, detail="Product not found")
        total += p.selling_price * item.quantity
    new_txn = Transaction(total_amount=total, payment_method=txn.payment_method)
    db.add(new_txn); db.commit(); db.refresh(new_txn)
    for item in txn.items:
        p = db.query(Product).filter(Product.sku == item.product_sku).first()
        p.stock_quantity -= item.quantity
        db.add(TransactionItem(transaction_id=new_txn.id, product_sku=item.product_sku, quantity=item.quantity, price_at_sale=p.selling_price))
    db.commit()
    return {"status": "success"}

@app.get("/transactions/")
def read_transactions(db: Session = Depends(get_db)): return db.query(Transaction).all()

# --- 4. STAFF & SUPPLIERS ---
@app.post("/staff/")
def create_staff(s: StaffCreate, db: Session = Depends(get_db)): db.add(Staff(**s.dict())); db.commit(); return {"status": "success"}
@app.get("/staff/")
def get_staff(db: Session = Depends(get_db)): return db.query(Staff).all()
@app.post("/suppliers/")
def create_supplier(s: SupplierCreate, db: Session = Depends(get_db)): db.add(Supplier(**s.dict())); db.commit(); return {"status": "success"}
@app.get("/suppliers/")
def get_suppliers(db: Session = Depends(get_db)): return db.query(Supplier).all()

# --- 5. AI ---
@app.post("/ai/chat")
def chat(query: dict):
    text = query.get("text", "").lower()
    if "sell" in text: return {"text": "Opening POS...", "action": "NAVIGATE_POS"}
    return {"text": "I can help you navigate.", "action": None}

@app.get("/ai/predict/{sku}")
def predict(sku: str, db: Session = Depends(get_db)): return {"sku": sku, "predicted_weekly_demand": 0, "trend": "No Data", "recommendation": "Gather more sales data"}