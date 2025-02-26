import { create } from 'zustand';
import { supabase } from '../services/supabase/supabaseClient';
import { useAuthStore } from './authStore';

interface Product {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  available: boolean;
}

interface CoinsState {
  coins: number;
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchCoins: () => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  removeCoins: (amount: number) => Promise<void>;
  purchaseProduct: (productId: string, shippingDetails: ShippingDetails) => Promise<void>;
}

interface ShippingDetails {
  name: string;
  mobile: string;
  address: string;
}

export const useCoinsStore = create<CoinsState>((set, get) => ({
  coins: 0,
  products: [
    {
      id: '1',
      name: 'Premium Notebook',
      description: 'High-quality notebook for your productivity needs',
      image: 'notebook.png',
      price: 500, // 500 coins = ~8 hours of focus time
      available: true
    },
    {
      id: '2',
      name: 'Focus Timer',
      description: 'Physical timer for distraction-free work',
      image: 'timer.png',
      price: 1000, // 1000 coins = ~16 hours of focus time
      available: true
    },
    {
      id: '3',
      name: 'Noise-Canceling Headphones',
      description: 'Premium headphones for deep work sessions',
      image: 'headphones.png',
      price: 3000, // 3000 coins = ~50 hours of focus time
      available: true
    }
  ],
  loading: false,
  error: null,

  fetchCoins: async () => {
    try {
      set({ loading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_coins')
        .select('coins')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      set({ coins: data?.coins || 0 });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  addCoins: async (amount: number) => {
    try {
      set({ loading: true, error: null });
      const user = useAuthStore.getState().user;
      
      if (!user) throw new Error('User not authenticated');

      // First check if user has a coins record
      const { data: existingData, error: fetchError } = await supabase
        .from('user_coins')
        .select('coins')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
        throw fetchError;
      }

      const currentCoins = existingData?.coins || 0;
      const newTotal = currentCoins + amount;

      if (existingData) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('user_coins')
          .update({ 
            coins: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('user_coins')
          .insert({
            user_id: user.id,
            coins: newTotal,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      // Update local state
      set({ coins: newTotal });
      
      // Fetch updated coins to ensure consistency
      await get().fetchCoins();
    } catch (error: any) {
      console.error('Error adding coins:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  removeCoins: async (amount: number) => {
    try {
      set({ loading: true });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const currentCoins = get().coins;
      if (currentCoins < amount) {
        throw new Error('Not enough coins');
      }

      const newTotal = currentCoins - amount;

      // Use update instead of upsert since we know the record exists
      const { error } = await supabase
        .from('user_coins')
        .update({ coins: newTotal })
        .eq('user_id', user.id);

      if (error) throw error;
      set({ coins: newTotal });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  purchaseProduct: async (productId: string, shippingDetails: ShippingDetails) => {
    try {
      set({ loading: true });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const product = get().products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      const currentCoins = get().coins;
      if (currentCoins < product.price) {
        throw new Error('Insufficient coins');
      }

      // Create order
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          product_id: productId,
          coins_spent: product.price,
          shipping_name: shippingDetails.name,
          shipping_mobile: shippingDetails.mobile,
          shipping_address: shippingDetails.address,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (orderError) throw orderError;

      // Deduct coins from user's balance
      const { error: updateError } = await supabase
        .from('user_coins')
        .update({ 
          coins: currentCoins - product.price,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      set({ coins: currentCoins - product.price });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  }
})); 