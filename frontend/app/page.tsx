"use client";
import { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, ShoppingCart, MessageSquare, TrendingUp, Package, 
  CreditCard, Search, ArrowRight, Sparkles, AlertCircle, CheckCircle2, 
  Send, Users, Truck, Settings, FileText, Plus, Save, Trash2, UserPlus
} from "lucide-react";

// --- TYPES ---
interface Product { id: number; sku: string; name: string; cost_price: number; selling_price: number; stock_quantity: number; category: string; }
interface CartItem extends Product { qty: number; }
interface Transaction { id: number; total_amount: number; payment_method: string; timestamp: string; }
interface AIPrediction { sku: string; predicted_weekly_demand: number; trend: "Growing" | "Declining"; recommendation: string; }
interface ChatMessage { sender: "user" | "nexus"; text: string; }
interface Staff { id: number; name: string; role: string; passcode: string; }
interface Supplier { id: number; name: string; contact_email: string; phone: string; }

// --- MAIN APP COMPONENT ---
export default function NexusApp() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [storeName, setStoreName] = useState("Nexus Retail Store"); // Local State for Settings

  // Central Data Fetcher
  const fetchProducts = () => {
    fetch("http://127.0.0.1:8000/products/")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(err => console.error("API Error - Is Backend Running?"));
  };

  useEffect(() => { 
    fetchProducts(); 
    const savedName = localStorage.getItem("storeName");
    if (savedName) setStoreName(savedName);
  }, []);

  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans text-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} storeName={storeName} />
      
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto custom-scrollbar">
          {/* DASHBOARD & POS */}
          {activeTab === "dashboard" && <DashboardView products={products} navigate={setActiveTab} />}
          {activeTab === "pos" && <POSView products={products} refresh={fetchProducts} />}
          {activeTab === "chat" && <ChatView navigate={setActiveTab} />}
          
          {/* MANAGEMENT MODULES */}
          {activeTab === "add-product" && <AddProductView refresh={fetchProducts} navigate={setActiveTab} />}
          {activeTab === "inventory" && <InventoryView products={products} refresh={fetchProducts} />}
          {activeTab === "reports" && <ReportsView />}
          
          {/* NEW COMPLETED MODULES */}
          {activeTab === "staff" && <StaffView />}
          {activeTab === "suppliers" && <SuppliersView />}
          {activeTab === "settings" && <SettingsView storeName={storeName} setStoreName={setStoreName} />}
        </div>
      </main>
    </div>
  );
}

// ==============================================
// 1. DASHBOARD VIEW
// ==============================================
function DashboardView({ products, navigate }: { products: Product[], navigate: Function }) {
  const lowStock = products.filter(p => p.stock_quantity < 10);
  return (
    <div className="p-10 max-w-7xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div><h2 className="text-4xl font-bold text-gray-900 tracking-tight">Operational Dashboard</h2><p className="text-gray-500 mt-2 text-lg">Overview & Quick Actions</p></div>
        <div className="hidden md:block"><span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-bold">{new Date().toLocaleDateString()}</span></div>
      </header>
      
      <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col hover:translate-y-[-2px] transition-transform">
          {lowStock.length > 0 ? (
            <>
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-4"><AlertCircle size={24}/></div>
              <h4 className="font-bold text-xl">Low Stock Alert</h4> <p className="text-gray-500 mt-2 flex-grow">{lowStock.length} items need attention.</p>
              <button onClick={() => navigate('inventory')} className="mt-4 text-orange-600 font-bold text-sm">View List →</button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4"><CheckCircle2 size={24}/></div>
              <h4 className="font-bold text-xl">Inventory Healthy</h4> <p className="text-gray-500 mt-2">All systems optimal.</p>
            </>
          )}
        </div>
        <div onClick={() => navigate('pos')} className="bg-blue-600 text-white p-6 rounded-[20px] shadow-lg shadow-blue-200 cursor-pointer hover:bg-blue-700 transition-all hover:translate-y-[-2px] flex flex-col">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4"><ShoppingCart size={24}/></div>
          <h4 className="font-bold text-xl">Open POS</h4> <p className="text-blue-100 mt-2">Process new sales.</p>
        </div>
        <div onClick={() => navigate('add-product')} className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 cursor-pointer hover:border-indigo-500 transition-all hover:translate-y-[-2px] flex flex-col">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4"><Plus size={24}/></div>
          <h4 className="font-bold text-xl">Add Product</h4> <p className="text-gray-500 mt-2">Register new stock items.</p>
        </div>
      </section>

      <h3 className="text-lg font-bold text-gray-700 mb-5">All Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionBtn icon={<Package/>} label="Inventory Count" onClick={() => navigate('inventory')} />
        <ActionBtn icon={<Plus/>} label="Add New Product" onClick={() => navigate('add-product')} />
        <ActionBtn icon={<FileText/>} label="Sales Reports" onClick={() => navigate('reports')} />
        <ActionBtn icon={<Users/>} label="Staff Management" onClick={() => navigate('staff')} />
        <ActionBtn icon={<Truck/>} label="Suppliers" onClick={() => navigate('suppliers')} />
        <ActionBtn icon={<Settings/>} label="Settings" onClick={() => navigate('settings')} />
      </div>
    </div>
  );
}

// ==============================================
// 2. POS VIEW
// ==============================================
function POSView({ products, refresh }: { products: Product[], refresh: Function }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [predictions, setPredictions] = useState<Record<string, AIPrediction>>({});
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.sku === product.sku);
      if (existing) return prev.map((item) => item.sku === product.sku ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const fetchAI = async (sku: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/ai/predict/${sku}`);
      const data = await res.json();
      setPredictions((prev) => ({ ...prev, [sku]: data }));
    } catch (err) { console.error(err); }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { alert("Cart is empty!"); return; }
    const payload = { payment_method: "CASH", items: cart.map((item) => ({ product_sku: item.sku, quantity: item.qty })) };
    try {
      const res = await fetch("http://127.0.0.1:8000/transactions/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) { alert("✅ Sale Successful!"); setCart([]); refresh(); } 
      else { const err = await res.json(); alert(`❌ Failed: ${err.detail}`); }
    } catch (err) { alert("Network Error"); }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.selling_price * item.qty, 0);

  return (
    <div className="flex h-full bg-[#F3F4F6]">
      <div className="w-2/3 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div><h2 className="text-3xl font-bold text-gray-900">Point of Sale</h2><p className="text-gray-500 mt-1">{products.length} Items</p></div>
          <div className="relative"><Search className="absolute left-4 top-3 text-gray-400" size={20} /><input type="text" placeholder="Search products..." className="pl-12 pr-6 py-3 rounded-full border border-gray-200 bg-white shadow-sm w-64" onChange={(e) => setSearch(e.target.value)} /></div>
        </header>
        <div className="grid grid-cols-3 gap-5">
          {filteredProducts.map((p) => (
            <div key={p.sku} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col" onClick={() => addToCart(p)}>
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400"><Package size={24} /></div>
                  <span className="text-[10px] font-bold tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-md">{p.sku}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-lg leading-tight truncate">{p.name}</h4>
                <p className="text-indigo-600 font-bold text-xl mt-2">R {p.selling_price}</p>
              </div>
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                {!predictions[p.sku] ? (
                  <button onClick={(e) => { e.stopPropagation(); fetchAI(p.sku); }} className="text-xs text-indigo-600 font-bold flex items-center gap-2 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors w-max"><Sparkles size={14} /> AI Insight</button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium"><TrendingUp size={14} className={predictions[p.sku].trend === 'Growing' ? 'text-emerald-500' : 'text-red-500'} /><span className="text-gray-700">Forecast: {predictions[p.sku].predicted_weekly_demand} units</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col shadow-xl z-30">
        <div className="p-8 border-b border-gray-100"><h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-3"><ShoppingCart className="text-indigo-600" size={24} /> Current Order</h3></div>
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {cart.length === 0 ? ( <div className="text-center text-gray-400 mt-20">Cart is empty</div> ) : (
            cart.map((item) => (
              <div key={item.sku} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">x{item.qty}</div>
                  <div><p className="font-bold text-gray-900 text-sm">{item.name}</p><p className="text-xs text-gray-500">R {item.selling_price}</p></div>
                </div>
                <span className="font-bold text-gray-900">R {(item.selling_price * item.qty).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
        <div className="p-8 bg-white border-t border-gray-100">
          <div className="flex justify-between items-center text-2xl font-bold text-gray-900 mb-6"><span>Total</span><span>R {totalAmount.toFixed(2)}</span></div>
          <button onClick={handleCheckout} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"><CreditCard size={20} /> Checkout</button>
        </div>
      </div>
    </div>
  );
}

// ==============================================
// 3. STAFF VIEW (Fully Functional)
// ==============================================
function StaffView() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState({ name: "", role: "Cashier", passcode: "" });

  const fetchStaff = () => {
    fetch("http://127.0.0.1:8000/staff/").then(r => r.json()).then(setStaff).catch(console.error);
  }

  useEffect(() => { fetchStaff(); }, []);

  const handleAdd = async () => {
    await fetch("http://127.0.0.1:8000/staff/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    alert("Staff Member Added"); fetchStaff(); setForm({ name: "", role: "Cashier", passcode: "" });
  };

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Staff Management</h2>
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex gap-2">
            <input placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded text-sm"/>
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border p-2 rounded text-sm"><option>Cashier</option><option>Manager</option></select>
            <input placeholder="Passcode" value={form.passcode} onChange={e => setForm({...form, passcode: e.target.value})} className="border p-2 rounded text-sm w-24"/>
            <button onClick={handleAdd} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"><UserPlus size={20}/></button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {staff.map(s => (
            <div key={s.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500">{s.name.charAt(0)}</div>
                    <div><h4 className="font-bold text-lg">{s.name}</h4><p className="text-sm text-gray-500">{s.role}</p></div>
                </div>
                <div className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-400">ID: {s.passcode}</div>
            </div>
        ))}
        {staff.length === 0 && <p className="text-gray-400 col-span-3 text-center py-10">No staff members found.</p>}
      </div>
    </div>
  )
}

// ==============================================
// 4. SUPPLIERS VIEW (Fully Functional)
// ==============================================
function SuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ name: "", contact_email: "", phone: "" });

  const fetchSuppliers = () => {
    fetch("http://127.0.0.1:8000/suppliers/").then(r => r.json()).then(setSuppliers).catch(console.error);
  }

  useEffect(() => { fetchSuppliers(); }, []);

  const handleAdd = async () => {
    await fetch("http://127.0.0.1:8000/suppliers/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    alert("Supplier Added"); fetchSuppliers(); setForm({ name: "", contact_email: "", phone: "" });
  };

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Suppliers</h2>
        <div className="bg-white p-4 rounded-xl border border-gray-200 flex gap-2">
            <input placeholder="Company Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded text-sm"/>
            <input placeholder="Email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})} className="border p-2 rounded text-sm"/>
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border p-2 rounded text-sm w-32"/>
            <button onClick={handleAdd} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"><Plus size={20}/></button>
        </div>
      </div>
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm"><tr><th className="p-5">Company</th><th className="p-5">Email</th><th className="p-5">Phone</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
                {suppliers.map(s => (
                    <tr key={s.id}><td className="p-5 font-bold">{s.name}</td><td className="p-5 text-gray-600">{s.contact_email}</td><td className="p-5 text-gray-600">{s.phone}</td></tr>
                ))}
            </tbody>
        </table>
        {suppliers.length === 0 && <p className="p-8 text-center text-gray-400">No suppliers registered.</p>}
      </div>
    </div>
  )
}

// ==============================================
// 5. SETTINGS VIEW (Functional)
// ==============================================
function SettingsView({ storeName, setStoreName }: any) {
  const [localName, setLocalName] = useState(storeName);

  const handleSave = () => {
    setStoreName(localName);
    localStorage.setItem("storeName", localName);
    alert("Settings Saved!");
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">System Settings</h2>
      <div className="bg-white p-8 rounded-[20px] border border-gray-200 space-y-6 shadow-sm">
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Store Name</label>
           <input value={localName} onChange={e => setLocalName(e.target.value)} className="w-full border border-gray-200 p-3 rounded-lg bg-gray-50"/>
           <p className="text-xs text-gray-400 mt-1">This name will appear on the sidebar.</p>
        </div>
        <div>
           <label className="block text-sm font-bold text-gray-700 mb-2">Currency</label>
           <select className="w-full border border-gray-200 p-3 rounded-lg bg-gray-50"><option>South African Rand (ZAR)</option><option>US Dollar ($)</option></select>
        </div>
        <button onClick={handleSave} className="w-full bg-gray-900 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2"><Save size={18}/> Save Changes</button>
      </div>
    </div>
  )
}

// ==============================================
// 6. OTHER VIEWS (Add Product, Inventory, Reports, Chat)
// ==============================================

function AddProductView({ refresh, navigate }: any) {
  const [form, setForm] = useState({ sku: "", name: "", cost_price: 0, selling_price: 0, stock_quantity: 0, category: "General" });
  const handleSubmit = async () => {
    const res = await fetch("http://127.0.0.1:8000/products/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { alert("Product Added!"); refresh(); navigate('dashboard'); } else alert("Error. SKU might already exist.");
  };
  return (
    <div className="p-10 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">Register New Product</h2>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Barcode / SKU</label><input placeholder="e.g. BAR-001" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50" onChange={e => setForm({...form, sku: e.target.value})} /></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label><input placeholder="e.g. Nike Air Max" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50" onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Cost (R)</label><input type="number" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50" onChange={e => setForm({...form, cost_price: parseFloat(e.target.value)})} /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-2">Selling (R)</label><input type="number" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50" onChange={e => setForm({...form, selling_price: parseFloat(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-6">
                 <div><label className="block text-sm font-bold text-gray-700 mb-2">Stock</label><input type="number" className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50" onChange={e => setForm({...form, stock_quantity: parseInt(e.target.value)})} /></div>
                 <div><label className="block text-sm font-bold text-gray-700 mb-2">Category</label><input className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50" onChange={e => setForm({...form, category: e.target.value})} /></div>
            </div>
            <button onClick={handleSubmit} className="w-full bg-indigo-600 text-white p-4 rounded-xl font-bold hover:bg-indigo-700">Save to Database</button>
        </div>
    </div>
  );
}

function InventoryView({ products, refresh }: any) {
  const updateStock = async (sku: string, newQty: number) => {
    await fetch(`http://127.0.0.1:8000/products/${sku}/stock`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quantity: newQty }) });
    refresh();
  };
  return (
    <div className="p-10">
      <h2 className="text-3xl font-bold mb-8">Inventory Control</h2>
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left"><thead className="bg-gray-50 text-gray-500 text-sm"><tr><th className="p-5 font-bold">SKU</th><th className="p-5 font-bold">Product Name</th><th className="p-5 font-bold">Stock Level</th><th className="p-5 font-bold">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{products.map((p: Product) => (<tr key={p.sku} className="hover:bg-gray-50"><td className="p-5 font-mono text-xs text-gray-500">{p.sku}</td><td className="p-5 font-bold text-gray-900">{p.name}</td><td className="p-5"><input type="number" defaultValue={p.stock_quantity} onBlur={(e) => updateStock(p.sku, parseInt(e.target.value))} className="w-24 border border-gray-200 rounded-lg p-2 text-center font-bold text-indigo-600" /></td><td className="p-5">{p.stock_quantity < 10 ? <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">Low Stock</span> : <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Good</span>}</td></tr>))}</tbody></table>
      </div>
    </div>
  );
}

function ReportsView() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  useEffect(() => { fetch("http://127.0.0.1:8000/transactions/").then(r => r.json()).then(setTxns); }, []);
  return (
    <div className="p-10">
      <h2 className="text-3xl font-bold mb-8">Sales Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"><div className="bg-white p-6 rounded-[20px] border border-gray-200 shadow-sm"><p className="text-gray-500 text-sm font-bold">Total Revenue (Last 50)</p><p className="text-3xl font-bold text-indigo-600 mt-2">R {txns.reduce((sum, t) => sum + t.total_amount, 0).toFixed(2)}</p></div></div>
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50 text-gray-500 text-sm"><tr><th className="p-5">Date</th><th className="p-5">ID</th><th className="p-5">Method</th><th className="p-5">Total</th></tr></thead><tbody className="divide-y divide-gray-100">{txns.map(t => (<tr key={t.id}><td className="p-5 text-gray-600">{new Date(t.timestamp).toLocaleDateString()}</td><td className="p-5 font-mono text-xs">#{t.id}</td><td className="p-5"><span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{t.payment_method}</span></td><td className="p-5 font-bold text-gray-900">R {t.total_amount.toFixed(2)}</td></tr>))}</tbody></table></div>
    </div>
  );
}

function ChatView({ navigate }: { navigate: Function }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([{ sender: "nexus", text: "I am Nexus. How can I help?" }]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessage = async () => { if (!input.trim()) return; const userMsg = input; setMessages(prev => [...prev, { sender: "user", text: userMsg }]); setInput(""); try { const res = await fetch("http://127.0.0.1:8000/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: userMsg }) }); const data = await res.json(); setMessages(prev => [...prev, { sender: "nexus", text: data.text }]); if (data.action === "NAVIGATE_POS") navigate("pos"); if (data.action === "NAVIGATE_REPORTS") navigate("reports"); if (data.action === "NAVIGATE_ADD_PRODUCT") navigate("add-product"); } catch (err) { setMessages(prev => [...prev, { sender: "nexus", text: "Connection error." }]); } };
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F9FAFB]">{messages.map((msg, i) => (<div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[70%] p-5 rounded-2xl text-sm shadow-sm ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"}`}>{msg.text}</div></div>))}<div ref={messagesEndRef} /></div>
      <div className="p-6 bg-white border-t border-gray-100 flex gap-3 max-w-4xl mx-auto w-full"><input className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ask Nexus..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} /><button onClick={sendMessage} className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg"><Send size={20} /></button></div>
    </div>
  );
}

// --- SIDEBAR & BUTTONS ---
function Sidebar({ activeTab, setActiveTab, storeName }: any) {
  return (
      <aside className="w-72 bg-white flex flex-col shadow-lg z-20">
        <div className="p-8 pb-4"><h1 className="text-2xl font-extrabold flex items-center gap-2 text-[#1E293B]">Nexus<span className="text-indigo-600">Retail</span></h1><p className="text-xs text-gray-400 font-medium mt-1 tracking-wide uppercase">{storeName}</p></div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavBtn active={activeTab} target="dashboard" set={setActiveTab} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <NavBtn active={activeTab} target="pos" set={setActiveTab} icon={<ShoppingCart size={20}/>} label="Point of Sale" />
          <NavBtn active={activeTab} target="inventory" set={setActiveTab} icon={<Package size={20}/>} label="Inventory" />
          <NavBtn active={activeTab} target="reports" set={setActiveTab} icon={<FileText size={20}/>} label="Reports" />
          <NavBtn active={activeTab} target="chat" set={setActiveTab} icon={<MessageSquare size={20}/>} label="AI Assistant" />
        </nav>
        <div className="p-6 mt-auto"><div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">M</div><div><p className="text-sm font-bold text-gray-800">Mbuso</p><p className="text-xs text-gray-500">Store Manager</p></div></div></div>
      </aside>
  );
}
function NavBtn({ active, target, set, icon, label }: any) { return <button onClick={() => set(target)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active === target ? "bg-indigo-50 text-indigo-700 font-bold" : "text-gray-500 hover:bg-gray-50"}`}>{icon} <span>{label}</span></button>; }
function ActionBtn({ icon, label, onClick }: any) { return <div onClick={onClick} className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-4 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group"><div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">{icon}</div><span className="font-semibold text-sm text-gray-700 group-hover:text-gray-900">{label}</span></div>; }