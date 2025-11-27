"use client";
import { useState, useEffect, useRef } from "react";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  MessageSquare, 
  TrendingUp, 
  Package, 
  CreditCard, 
  Search, 
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Send,
  Menu,
  MoreVertical,
  ChevronRight
} from "lucide-react";

// --- TYPES ---
interface Product {
  id: number;
  sku: string;
  name: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  category: string;
}

interface CartItem extends Product {
  qty: number;
}

interface AIPrediction {
  sku: string;
  predicted_weekly_demand: number;
  trend: "Growing" | "Declining";
  recommendation: string;
}

interface ChatMessage {
  sender: "user" | "nexus";
  text: string;
}

// --- MAIN COMPONENT ---
export default function NexusApp() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "pos" | "chat">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA ON LOAD
  useEffect(() => {
    fetch("https://nexus-retail-ai.onrender.com/products/")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => console.error("Backend offline or CORS error"));
  }, []);

  // --- RENDERERS ---
  return (
    <div className="flex h-screen bg-[#F3F4F6] font-sans text-gray-900">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-72 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-extrabold flex items-center gap-2 text-[#1E293B]">
            Nexus<span className="text-indigo-600">Retail</span>
          </h1>
          <p className="text-xs text-gray-400 font-medium mt-1 tracking-wide uppercase">Enterprise Suite v1.0</p>
        </div>

        <nav className="flex-1 px-4 space-y-3 mt-4">
          <NavButton 
            active={activeTab === "dashboard"} 
            onClick={() => setActiveTab("dashboard")} 
            icon={<LayoutDashboard size={22} />} 
            label="Dashboard" 
            desc="Overview & Actions"
          />
          <NavButton 
            active={activeTab === "pos"} 
            onClick={() => setActiveTab("pos")} 
            icon={<ShoppingCart size={22} />} 
            label="Point of Sale" 
            desc="Process Transactions"
          />
          <NavButton 
            active={activeTab === "chat"} 
            onClick={() => setActiveTab("chat")} 
            icon={<MessageSquare size={22} />} 
            label="Nexus Assistant" 
            desc="AI Support Agent"
          />
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-200">
              M
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Mbuso</p>
              <p className="text-xs text-gray-500">Store Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto custom-scrollbar">
          {activeTab === "dashboard" && <DashboardView products={products} navigate={setActiveTab} />}
          {activeTab === "pos" && <POSView products={products} />}
          {activeTab === "chat" && <ChatView navigate={setActiveTab} />}
        </div>
      </main>
    </div>
  );
}

// --- 1. DASHBOARD VIEW (High-End Card Aesthetic) ---
function DashboardView({ products, navigate }: { products: Product[], navigate: Function }) {
  const lowStockItems = products.filter(p => p.stock_quantity < 10);

  return (
    <div className="p-10 max-w-7xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Operational Dashboard</h2>
          <p className="text-gray-500 mt-2 text-lg">Welcome back. Here is your operational overview.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* SUGGESTIONS SECTION */}
      <section className="mb-12">
        <h3 className="text-lg font-bold text-gray-700 mb-5 flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={20} /> Nexus AI Suggestions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* CARD 1: INVENTORY STATUS */}
          {lowStockItems.length > 0 ? (
            <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full hover:translate-y-[-2px] transition-transform duration-300">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Low Stock Alert</h4>
              <p className="text-gray-500 mb-6 leading-relaxed flex-grow">
                <span className="font-bold text-orange-600">{lowStockItems.length} items</span> are below safety stock levels. Review procurement immediately.
              </p>
              <button className="w-full py-3 rounded-xl bg-orange-50 text-orange-700 font-bold text-sm hover:bg-orange-100 transition-colors">
                View Inventory
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full hover:translate-y-[-2px] transition-transform duration-300">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                <CheckCircle2 size={24} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Inventory Healthy</h4>
              <p className="text-gray-500 mb-6 leading-relaxed flex-grow">
                All stock levels are optimal. No immediate actions required.
              </p>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-full"></div>
              </div>
            </div>
          )}

          {/* CARD 2: START SELLING */}
          <div 
            onClick={() => navigate('pos')}
            className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full cursor-pointer hover:translate-y-[-2px] transition-transform duration-300 group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ShoppingCart size={24} />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Start Selling</h4>
            <p className="text-gray-500 mb-6 leading-relaxed flex-grow">
              Open the POS terminal to process customer transactions and managing orders.
            </p>
            <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              Open POS <ArrowRight size={16} />
            </button>
          </div>

           {/* CARD 3: ASK NEXUS */}
           <div 
            onClick={() => navigate('chat')}
            className="bg-white rounded-[20px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-full cursor-pointer hover:translate-y-[-2px] transition-transform duration-300 group"
           >
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <MessageSquare size={24} />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Ask Nexus</h4>
            <p className="text-gray-500 mb-6 leading-relaxed flex-grow">
              Need help? I can analyze data, check prices, or guide you through the system.
            </p>
            <button className="w-full py-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm hover:bg-indigo-100 transition-colors">
              Chat Assistant
            </button>
          </div>
        </div>
      </section>

      {/* ALL ACTIONS GRID */}
      <section>
        <h3 className="text-lg font-bold text-gray-700 mb-5">All Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Inventory Count", "Add New Product", "Sales Reports", "Staff Management", "Suppliers", "Settings"].map((action, i) => (
            <div key={action} className="bg-white border border-gray-200 p-4 rounded-xl flex items-center gap-4 hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all group">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Search size={18} />
              </div>
              <span className="font-semibold text-sm text-gray-700 group-hover:text-gray-900">{action}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// --- 2. POS VIEW (Fixed Checkout Logic) ---
function POSView({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [predictions, setPredictions] = useState<Record<string, AIPrediction>>({});
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.sku === product.sku);
      if (existing) return prev.map((item) => item.sku === product.sku ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const fetchAI = async (sku: string) => {
    try {
      const res = await fetch(`https://nexus-retail-ai.onrender.com/ai/predict/${sku}`);
      const data = await res.json();
      setPredictions((prev) => ({ ...prev, [sku]: data }));
    } catch (err) { console.error(err); }
  };

  // --- NEW: THE MISSING CHECKOUT LOGIC ---
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    const payload = {
      payment_method: "CASH",
      items: cart.map((item) => ({ product_sku: item.sku, quantity: item.qty })),
    };

    try {
      const res = await fetch("https://nexus-retail-ai.onrender.com/transactions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("✅ Sale Successful! Inventory updated.");
        setCart([]); // Clear the cart
        window.location.reload(); // Refresh to show new stock levels
      } else {
        const err = await res.json();
        alert(`❌ Failed: ${err.detail}`);
      }
    } catch (err) {
      alert("❌ Network Error. Is the backend running?");
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.selling_price * item.qty, 0);

  return (
    <div className="flex h-full bg-[#F3F4F6]">
      {/* Product Grid */}
      <div className="w-2/3 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Point of Sale</h2>
            <p className="text-gray-500 mt-1">{products.length} Items Available</p>
          </div>
          <div className="relative">
             <Search className="absolute left-4 top-3 text-gray-400" size={20} />
             <input 
              type="text" 
              placeholder="Search products..." 
              className="pl-12 pr-6 py-3 rounded-full border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              onChange={(e) => setSearch(e.target.value)}
             />
          </div>
        </header>

        <div className="grid grid-cols-3 gap-5">
          {filteredProducts.map((p) => (
            <div key={p.sku} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all cursor-pointer group flex flex-col h-full" onClick={() => addToCart(p)}>
              <div className="p-5 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Package size={24} />
                  </div>
                  <span className="text-[10px] font-bold tracking-wider bg-gray-100 text-gray-500 px-2 py-1 rounded-md">{p.sku}</span>
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-1 leading-tight">{p.name}</h4>
                <p className="text-gray-400 text-xs mb-3">{p.category}</p>
                <p className="text-indigo-600 font-bold text-xl">R {p.selling_price}</p>
              </div>
              
              {/* AI Footer */}
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                {!predictions[p.sku] ? (
                  <button onClick={(e) => { e.stopPropagation(); fetchAI(p.sku); }} className="text-xs text-indigo-600 font-semibold flex items-center gap-2 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors w-max">
                    <Sparkles size={14} /> AI Insight
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <TrendingUp size={14} className={predictions[p.sku].trend === 'Growing' ? 'text-emerald-500' : 'text-red-500'} />
                    <span className="text-gray-700">Forecast: {predictions[p.sku].predicted_weekly_demand} units</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-1/3 bg-white border-l border-gray-200 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.03)] z-30">
        <div className="p-8 border-b border-gray-100 bg-white">
          <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="text-indigo-600" size={24} /> 
            Current Order
          </h3>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} opacity={0.3} />
              </div>
              <p className="text-sm font-medium">Cart is empty</p>
              <p className="text-xs">Select items to begin</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.sku} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                    x{item.qty}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">R {item.selling_price}/unit</p>
                  </div>
                </div>
                <span className="font-bold text-gray-900">R {(item.selling_price * item.qty).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-white border-t border-gray-100">
          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Subtotal</span>
              <span>R {totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-sm">
              <span>Tax (15%)</span>
              <span>R {(totalAmount * 0.15).toFixed(2)}</span>
            </div>
            <div className="h-px bg-gray-100 my-2"></div>
            <div className="flex justify-between items-center text-2xl font-bold text-gray-900">
              <span>Total</span>
              <span>R {(totalAmount * 1.15).toFixed(2)}</span>
            </div>
          </div>
          <button 
            onClick={handleCheckout} 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <CreditCard size={20} /> Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 3. CHAT VIEW (Nexus Persona - Bubble Style) ---
function ChatView({ navigate }: { navigate: Function }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "nexus", text: "Hello Mbuso. I am Nexus, your Operations Assistant. How can I facilitate your work today?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setInput("");

    try {
      const res = await fetch("https://nexus-retail-ai.onrender.com/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: "nexus", text: data.text }]);
      if (data.action === "NAVIGATE_POS") navigate("pos");
      if (data.action === "NAVIGATE_DASHBOARD") navigate("dashboard");
    } catch (err) {
      setMessages(prev => [...prev, { sender: "nexus", text: "Connection error." }]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-white">
      <header className="p-6 border-b border-gray-100 flex items-center gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Sparkles size={24} />
        </div>
        <div>
          <h2 className="font-bold text-xl text-gray-900">Nexus AI</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-xs text-gray-500 font-medium">Online & Ready</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#F9FAFB]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.sender === "user" 
                ? "bg-indigo-600 text-white rounded-br-none" 
                : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-gray-100">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input 
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
            placeholder="Type your command..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage} className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper: Sidebar Button with Hover Effects
function NavButton({ active, onClick, icon, label, desc }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 group ${
        active 
          ? "bg-indigo-50 text-indigo-700 shadow-sm" 
          : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      <div className={`transition-colors ${active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}`}>
        {icon}
      </div>
      <div className="text-left">
        <span className={`block font-bold text-sm ${active ? "text-gray-900" : "text-gray-600 group-hover:text-gray-900"}`}>{label}</span>
        <span className="text-[10px] text-gray-400 font-medium">{desc}</span>
      </div>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
    </button>
  );
}