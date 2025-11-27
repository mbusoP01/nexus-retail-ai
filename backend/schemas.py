from pydantic import BaseModel
from typing import List, Optional

# --- PRODUCT SCHEMAS ---
class ProductBase(BaseModel):
    sku: str
    name: str
    cost_price: float
    selling_price: float
    stock_quantity: int
    category: str

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    class Config:
        orm_mode = True

# --- TRANSACTION SCHEMAS ---
class TransactionItemCreate(BaseModel):
    product_sku: str
    quantity: int

class TransactionCreate(BaseModel):
    payment_method: str
    items: List[TransactionItemCreate]