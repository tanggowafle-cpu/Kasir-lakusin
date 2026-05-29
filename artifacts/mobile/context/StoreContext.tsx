import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Debt, Expense, Product, StockHistory, StoreSettings, Transaction } from '@/types';

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

interface StoreContextType {
  products: Product[];
  transactions: Transaction[];
  expenses: Expense[];
  debts: Debt[];
  stockHistory: StockHistory[];
  storeSettings: StoreSettings;
  loading: boolean;

  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStok: (productId: string, jenis: 'masuk' | 'keluar', jumlah: number, catatan?: string) => Promise<void>;

  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;

  addExpense: (e: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, e: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  addDebt: (d: Omit<Debt, 'id'>) => Promise<void>;
  markDebtPaid: (id: string) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  updateStoreSettings: (s: Partial<StoreSettings>) => Promise<void>;
}

const defaultSettings: StoreSettings = {
  namaWarung: 'Warung Saya',
  nomorWhatsapp: '',
  stokMinimumDefault: 5,
};

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

function key(userId: string, name: string) {
  return `@lakusin/${name}/${userId}`;
}

async function load<T>(k: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(k);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function save<T>(k: string, value: T): Promise<void> {
  await AsyncStorage.setItem(k, JSON.stringify(value));
}

export function StoreProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const uid = useRef(userId);

  useEffect(() => {
    uid.current = userId;
    (async () => {
      setLoading(true);
      const [p, t, e, d, sh, ss] = await Promise.all([
        load<Product[]>(key(userId, 'products'), []),
        load<Transaction[]>(key(userId, 'transactions'), []),
        load<Expense[]>(key(userId, 'expenses'), []),
        load<Debt[]>(key(userId, 'debts'), []),
        load<StockHistory[]>(key(userId, 'stockHistory'), []),
        load<StoreSettings>(key(userId, 'settings'), defaultSettings),
      ]);
      setProducts(p);
      setTransactions(t);
      setExpenses(e);
      setDebts(d);
      setStockHistory(sh);
      setStoreSettings(ss);
      setLoading(false);
    })();
  }, [userId]);

  const addProduct = useCallback(async (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newP: Product = { ...p, id: genId(), createdAt: now, updatedAt: now };
    setProducts((prev) => {
      const next = [...prev, newP];
      save(key(uid.current, 'products'), next);
      return next;
    });
  }, []);

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    setProducts((prev) => {
      const next = prev.map((x) => x.id === id ? { ...x, ...p, updatedAt: new Date().toISOString() } : x);
      save(key(uid.current, 'products'), next);
      return next;
    });
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setProducts((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(key(uid.current, 'products'), next);
      return next;
    });
  }, []);

  const updateStok = useCallback(async (productId: string, jenis: 'masuk' | 'keluar', jumlah: number, catatan = '') => {
    let namaProduct = '';
    let stokSebelum = 0;
    let stokSesudah = 0;

    setProducts((prev) => {
      const next = prev.map((x) => {
        if (x.id !== productId) return x;
        namaProduct = x.nama;
        stokSebelum = x.stok;
        const newStok = jenis === 'masuk' ? x.stok + jumlah : Math.max(0, x.stok - jumlah);
        stokSesudah = newStok;
        return { ...x, stok: newStok, updatedAt: new Date().toISOString() };
      });
      save(key(uid.current, 'products'), next);
      return next;
    });

    const entry: StockHistory = {
      id: genId(),
      productId,
      namaProduct,
      jenis,
      jumlah,
      stokSebelum,
      stokSesudah,
      catatan,
      tanggal: new Date().toISOString(),
    };
    setStockHistory((prev) => {
      const next = [entry, ...prev];
      save(key(uid.current, 'stockHistory'), next);
      return next;
    });
  }, []);

  const addTransaction = useCallback(async (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newT: Transaction = { ...t, id: genId(), createdAt: new Date().toISOString() };
    setTransactions((prev) => {
      const next = [newT, ...prev];
      save(key(uid.current, 'transactions'), next);
      return next;
    });
    setProducts((prev) => {
      const next = prev.map((p) => {
        const item = t.items.find((i) => i.productId === p.id);
        if (!item) return p;
        return { ...p, stok: Math.max(0, p.stok - item.jumlah), updatedAt: new Date().toISOString() };
      });
      save(key(uid.current, 'products'), next);
      return next;
    });
  }, []);

  const addExpense = useCallback(async (e: Omit<Expense, 'id'>) => {
    const newE: Expense = { ...e, id: genId() };
    setExpenses((prev) => {
      const next = [newE, ...prev];
      save(key(uid.current, 'expenses'), next);
      return next;
    });
  }, []);

  const updateExpense = useCallback(async (id: string, e: Partial<Expense>) => {
    setExpenses((prev) => {
      const next = prev.map((x) => x.id === id ? { ...x, ...e } : x);
      save(key(uid.current, 'expenses'), next);
      return next;
    });
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(key(uid.current, 'expenses'), next);
      return next;
    });
  }, []);

  const addDebt = useCallback(async (d: Omit<Debt, 'id'>) => {
    const newD: Debt = { ...d, id: genId() };
    setDebts((prev) => {
      const next = [newD, ...prev];
      save(key(uid.current, 'debts'), next);
      return next;
    });
  }, []);

  const markDebtPaid = useCallback(async (id: string) => {
    setDebts((prev) => {
      const next = prev.map((x) => x.id === id ? { ...x, sudahLunas: true, tanggalLunas: new Date().toISOString() } : x);
      save(key(uid.current, 'debts'), next);
      return next;
    });
  }, []);

  const deleteDebt = useCallback(async (id: string) => {
    setDebts((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(key(uid.current, 'debts'), next);
      return next;
    });
  }, []);

  const updateStoreSettings = useCallback(async (s: Partial<StoreSettings>) => {
    setStoreSettings((prev) => {
      const next = { ...prev, ...s };
      save(key(uid.current, 'settings'), next);
      return next;
    });
  }, []);

  return (
    <StoreContext.Provider value={{
      products, transactions, expenses, debts, stockHistory, storeSettings, loading,
      addProduct, updateProduct, deleteProduct, updateStok,
      addTransaction, addExpense, updateExpense, deleteExpense,
      addDebt, markDebtPaid, deleteDebt, updateStoreSettings,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
