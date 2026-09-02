import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '../services/api';
import { Customer, MenuProduct, InventoryItem, DailyLimit } from '../types';

export interface AppSettings {
  logo?: string | null;
  color?: string;
  companyName?: string;
  pixKey?: string;
  companyPhone?: string;
  companyInstagram?: string;
  defaultDeliveryFee?: string;
  dietaryWarning?: string;
  [key: string]: any;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
}

interface AppDataContextType {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  menuProducts: MenuProduct[];
  setMenuProducts: React.Dispatch<React.SetStateAction<MenuProduct[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  dailyLimits: DailyLimit[];
  setDailyLimits: React.Dispatch<React.SetStateAction<DailyLimit[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  isLoaded: boolean;
  refreshAll: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  refreshMenuProducts: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({});
  const [dailyLimits, setDailyLimits] = useState<DailyLimit[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshCustomers = useCallback(async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error('Erro ao recarregar clientes:', e);
    }
  }, []);

  const refreshMenuProducts = useCallback(async () => {
    try {
      const data = await api.getMenuProducts();
      setMenuProducts(data);
    } catch (e) {
      console.error('Erro ao recarregar produtos do menu:', e);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    try {
      const data = await api.getInventory();
      setInventory(data);
    } catch (e) {
      console.error('Erro ao recarregar estoque:', e);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (e) {
      console.error('Erro ao recarregar configurações:', e);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      const [custData, menuData, invData, settData, limData, expData] = await Promise.all([
        api.getCustomers().catch(() => []),
        api.getMenuProducts().catch(() => []),
        api.getInventory().catch(() => []),
        api.getSettings().catch(() => ({})),
        api.getDailyLimits ? api.getDailyLimits().catch(() => []) : Promise.resolve([]),
        api.getExpenses ? api.getExpenses().catch(() => []) : Promise.resolve([]),
      ]);
      setCustomers(custData);
      setMenuProducts(menuData);
      setInventory(invData);
      setSettings(settData);
      setDailyLimits(limData);
      setExpenses(expData);
      setIsLoaded(true);
    } catch (error) {
      console.error('Erro ao carregar dados base da aplicação:', error);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <AppDataContext.Provider
      value={{
        customers,
        setCustomers,
        menuProducts,
        setMenuProducts,
        inventory,
        setInventory,
        settings,
        setSettings,
        dailyLimits,
        setDailyLimits,
        expenses,
        setExpenses,
        isLoaded,
        refreshAll,
        refreshCustomers,
        refreshMenuProducts,
        refreshInventory,
        refreshSettings,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData deve ser utilizado dentro de um AppDataProvider');
  }
  return context;
}
