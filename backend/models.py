from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True) # Barcode
    name = Column(String)
    description = Column(String, nullable=True)
    cost_price = Column(Float) # Important for ERP profit calc
    selling_price = Column(Float)
    stock_quantity = Column(Integer, default=0)
    category = Column(String, index=True)
    
    # Auto-managed timestamps
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    total_amount = Column(Float)
    payment_method = Column(String) # Cash, Card, etc.
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Link to items sold
    items = relationship("TransactionItem", back_populates="transaction")

class TransactionItem(Base):
    __tablename__ = "transaction_items"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    product_sku = Column(String, ForeignKey("products.sku"))
    quantity = Column(Integer)
    price_at_sale = Column(Float) # Store price at moment of sale (prices change!)
    
    transaction = relationship("Transaction", back_populates="items")