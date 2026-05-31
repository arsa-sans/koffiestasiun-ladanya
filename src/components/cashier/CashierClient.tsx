"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Settings2 } from "lucide-react";
import ProductCard from "@/components/cashier/ProductCard";
import CartPanel, { type CartItemType } from "@/components/cashier/CartPanel";
import ModifierModal, { type SelectedModifier } from "@/components/cashier/ModifierModal";
import PaymentModal from "@/components/cashier/PaymentModal";
import RecipeDetailModal from "@/components/cashier/RecipeDetailModal";
import TableManagementModal from "@/components/cashier/TableManagementModal";
import { createOrder } from "@/server/actions/orders";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Category { id: string; name: string; slug: string }
// Full product type (from server, used in ProductCard)
interface Product { id: string; name: string; description?: string | null; price: string; imageUrl?: string | null; isAvailable: boolean; categoryId?: string; stationId?: string; stationName?: string | null; stationType?: string | null; maxStock?: number | null; recipes?: { ingredientId: string; quantity: number }[]; }
// Minimal product type returned by ModifierModal's onConfirm callback
interface BaseProduct { id: string; name: string; price: string; imageUrl?: string | null; isAvailable?: boolean; categoryId?: string; stationId?: string; maxStock?: number | null; recipes?: { ingredientId: string; quantity: number }[]; }
interface ModifierGroup { id: string; name: string; isRequired: boolean; isMultiple: boolean; minSelect: number; maxSelect: number; options: { id: string; name: string; price: string }[] }

interface CashierClientProps {
  categories: Category[];
  initialIngredients: Record<string, number>;
  products: Product[];
  tables: { id: string; code: string; name: string }[];
}


export default function CashierClient({ categories, initialIngredients, products, tables }: CashierClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [payingTotal, setPayingTotal] = useState(0);
  const [orderPlacing, setOrderPlacing] = useState(false);
  const [recipeProductId, setRecipeProductId] = useState<string | null>(null);
  const [showTableManager, setShowTableManager] = useState(false);
  const [localTables, setLocalTables] = useState(tables);

  // Dynamic Stock Calculation
  const remainingIngredients = useMemo(() => {
    const usage: Record<string, number> = {};
    cartItems.forEach(item => {
      // Find the base product to get its recipes
      const product = products.find(p => p.id === item.productId);
      if (product && product.recipes) {
        product.recipes.forEach(r => {
          usage[r.ingredientId] = (usage[r.ingredientId] || 0) + (r.quantity * item.quantity);
        });
      }
    });

    const remaining: Record<string, number> = { ...initialIngredients };
    for (const [id, used] of Object.entries(usage)) {
      if (remaining[id] !== undefined) {
        remaining[id] -= used;
      }
    }
    return remaining;
  }, [cartItems, initialIngredients, products]);

  const dynamicProducts = useMemo(() => {
    return products.map(p => {
      let maxStock: number | null = null;
      if (p.recipes && p.recipes.length > 0) {
        maxStock = Math.min(
          ...p.recipes.map(r => {
            const currentRemaining = remainingIngredients[r.ingredientId] || 0;
            return Math.floor(currentRemaining / r.quantity);
          })
        );
        if (maxStock < 0 || isNaN(maxStock)) maxStock = 0;
      }
      return { ...p, maxStock };
    });
  }, [products, remainingIngredients]);

  const filteredProducts = dynamicProducts.filter((p) => {
    if (selectedCategory !== "all" && p.categoryId !== selectedCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleProductClick = async (product: Product): Promise<void> => {
    // Always show the detail modal (quantity, notes, modifiers if any)
    try {
      const res = await fetch(`/api/products/${product.id}/modifiers`);
      const data = await res.json();
      setModifierGroups(data.modifierGroups || []);
    } catch {
      setModifierGroups([]);
    }
    setModifierProduct(product);
  };

  const addToCart = useCallback((product: BaseProduct, qty: number, modifiers: SelectedModifier[], notes: string) => {
    setCartItems((prev) => {
      // Find dynamic maxStock (which already accounts for cart usage)
      const dynamicProd = dynamicProducts.find(p => p.id === product.id);
      
      const availableToAdd = dynamicProd?.maxStock !== null && dynamicProd?.maxStock !== undefined
        ? dynamicProd.maxStock
        : Infinity;
        
      const finalQty = Math.min(qty, availableToAdd);
      
      if (finalQty <= 0) {
        toast.error(`Stok ${product.name} tidak mencukupi`);
        return prev;
      }

      toast.success(`${product.name} ditambahkan`);
      return [
        ...prev,
        {
          id: uuidv4(),
          productId: product.id,
          productName: product.name,
          quantity: finalQty,
          unitPrice: parseFloat(product.price),
          modifiers,
          notes,
          maxStock: dynamicProd?.maxStock !== null && dynamicProd?.maxStock !== undefined ? finalQty + dynamicProd.maxStock : null, // Store total potential max for this variant
        },
      ];
    });
  }, [dynamicProducts]);

  const updateQty = (id: string, qty: number) => {
    setCartItems((prev) => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      
      const dynamicProd = dynamicProducts.find(p => p.id === item.productId);
      
      const availableToAdd = dynamicProd?.maxStock !== null && dynamicProd?.maxStock !== undefined
        ? dynamicProd.maxStock
        : Infinity;
      
      // If we are increasing quantity, check if we have enough stock left
      // If we are decreasing, we don't need to check
      const qtyDiff = qty - item.quantity;
      const finalQty = qtyDiff > 0 
        ? item.quantity + Math.min(qtyDiff, availableToAdd)
        : qty;
        
      if (qtyDiff > 0 && qtyDiff > availableToAdd) {
        toast.error(`Stok tersisa maksimal ${item.quantity + availableToAdd} porsi`);
      }
      
      return prev.map((i) => (i.id === id ? { 
        ...i, 
        quantity: finalQty,
        maxStock: dynamicProd?.maxStock !== null && dynamicProd?.maxStock !== undefined ? finalQty + dynamicProd.maxStock : null,
      } : i));
    });
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setOrderPlacing(true);

    try {
      const result = await createOrder({
        tableId: selectedTableId || undefined,
        customerName: customerName || undefined,
        orderType: selectedTableId ? "dine_in" : "takeaway",
        items: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
          modifiers: item.modifiers,
        })),
        notes: orderNotes || undefined,
      });

      if (result.success && result.orderId) {
        setPayingOrderId(result.orderId);
        setPayingTotal(result.totalAmount);
        toast.success(`Order ${result.orderNumber} dibuat!`);
      }
    } catch (err) {
      toast.error("Gagal membuat order");
    } finally {
      setOrderPlacing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setCartItems([]);
    setCustomerName("");
    setOrderNotes("");
    setSelectedTableId("");
    setPayingOrderId(null);
    toast.success("Transaksi selesai! 🎉");
  };

  return (
    <div className="flex h-full" style={{ height: "100vh" }}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", background: "rgba(248,245,242,0.8)" }}>
          {/* Search */}
          <div className="flex-1 relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(44,36,27,0.35)" />
            <input type="text" placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pos-input pl-9" style={{ fontSize: "14px", padding: "9px 12px 9px 36px" }} />
          </div>

          {/* Table select */}
          <select value={selectedTableId} onChange={(e) => setSelectedTableId(e.target.value)}
            className="pos-input" style={{ fontSize: "13px", padding: "9px 12px", width: "auto", cursor: "pointer" }}>
            <option value="">Takeaway</option>
            {localTables.map((t) => <option key={t.id} value={t.id}>Meja {t.code}</option>)}
          </select>

          {/* Table management button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTableManager(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: "rgba(192,139,92,0.1)",
              border: "1px solid rgba(192,139,92,0.2)",
              color: "#C08B5C",
            }}
            title="Kelola Meja"
          >
            <Settings2 size={14} />
            Meja
          </motion.button>
        </div>

        {/* Category Filter */}
        <div className="px-5 py-3 flex items-center gap-2 overflow-x-auto" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
          {[{ id: "all", name: "Semua" }, ...categories].map((cat) => (
            <motion.button key={cat.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedCategory(cat.id)}
              className="modifier-pill flex-shrink-0"
              style={{ background: selectedCategory === cat.id ? "rgba(192,139,92,0.15)" : "#F1EBE4", borderColor: selectedCategory === cat.id ? "#C08B5C" : "rgba(0,0,0,0.1)", color: selectedCategory === cat.id ? "#C08B5C" : "#5C4B3F" }}>
              {cat.name}
            </motion.button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <AnimatePresence>
              {filteredProducts.map((product, i) => (
                <motion.div key={product.id} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <ProductCard product={product} onSelect={handleProductClick} onViewRecipe={(id) => setRecipeProductId(id)} />
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <p className="text-4xl mb-3">☕</p>
                <p style={{ color: "rgba(44,36,27,0.4)" }}>Tidak ada produk ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <CartPanel 
        items={cartItems.map(item => {
          const dynamicProd = dynamicProducts.find(p => p.id === item.productId);
          return {
            ...item,
            // The max stock for this specific line item is its current quantity + whatever is still available
            maxStock: dynamicProd?.maxStock !== null && dynamicProd?.maxStock !== undefined 
              ? item.quantity + dynamicProd.maxStock 
              : null
          };
        })} 
        customerName={customerName} 
        notes={orderNotes}
        onUpdateQty={updateQty} onRemove={removeItem}
        onCustomerNameChange={setCustomerName} onNotesChange={setOrderNotes}
        onCheckout={handleCheckout} />

      {/* Modifier Modal */}
      <AnimatePresence>
        {modifierProduct && (
          <ModifierModal product={modifierProduct} modifierGroups={modifierGroups}
            onClose={() => setModifierProduct(null)}
            onConfirm={(prod, qty, mods, notes) => { addToCart(prod, qty, mods, notes); setModifierProduct(null); }} />
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {payingOrderId && (
          <PaymentModal orderId={payingOrderId} totalAmount={payingTotal}
            onClose={() => setPayingOrderId(null)} onSuccess={handlePaymentSuccess} />
        )}
      </AnimatePresence>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        productId={recipeProductId}
        onClose={() => setRecipeProductId(null)}
      />

      {/* Table Management Modal */}
      {showTableManager && (
        <TableManagementModal
          tables={localTables}
          onClose={() => setShowTableManager(false)}
          onTablesChange={(newTables) => setLocalTables(newTables)}
        />
      )}
    </div>
  );
}
