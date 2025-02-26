import { create } from 'zustand';
import { supabase } from '../services/supabase/supabaseClient';
import { useAuthStore } from './authStore';

export interface Purchase {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  cost: number;
  purchased_at: string;
  gift_code?: string | null;
  shipping_details?: {
    name: string;
    mobile: string;
    address: string;
  } | null;
}

interface PurchasesState {
  purchases: Purchase[];
  loading: boolean;
  error: string | null;
  fetchPurchases: () => Promise<void>;
  addPurchase: (item: { 
    id: string; 
    name: string; 
    cost: number;
    gift_code?: string;
    shipping_details?: {
      name: string;
      mobile: string;
      address: string;
    };
  }) => Promise<void>;
}

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  purchases: [],
  loading: false,
  error: null,

  fetchPurchases: async () => {
    try {
      set({ loading: true });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      set({ purchases: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addPurchase: async (item) => {
    try {
      set({ loading: true });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const purchase = {
        user_id: user.id,
        item_id: item.id,
        item_name: item.name,
        cost: item.cost,
        gift_code: item.gift_code || null,
        shipping_details: item.shipping_details || null,
        purchased_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_purchases')
        .insert([purchase]);

      if (error) throw error;

      await get().fetchPurchases();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
})); 