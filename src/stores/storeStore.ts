import { create } from 'zustand';
import { supabase } from '../services/supabase/supabaseClient';
import { useAuthStore } from './authStore';
import { useCoinsStore } from './coinsStore';
import { usePurchasesStore } from './purchasesStore';
import * as Clipboard from 'expo-clipboard';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  image_url: string;
  type: 'physical' | 'digital';
  isGiftCard?: boolean;
}

interface ShippingDetails {
  name: string;
  mobile: string;
  address: string;
}

interface StoreState {
  items: StoreItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  purchaseItem: (itemId: string, shippingDetails?: ShippingDetails) => Promise<{ giftCode?: string }>;
  generateGiftCode: () => string;
}

const generateGiftCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

export const useStoreStore = create<StoreState>((set, get) => ({
  items: [
    {
      id: '1',
      name: 'Focus Timer Pro',
      description: 'Unlock advanced timer features and statistics',
      cost: 100,
      image_url: 'timer.png',
      type: 'digital'
    },
    {
      id: '2',
      name: 'Premium Notebook',
      description: 'High-quality notebook for your productivity journey',
      cost: 200,
      image_url: 'notebook.png',
      type: 'physical'
    },
    {
      id: '3',
      name: 'Focus Headphones',
      description: 'Noise-cancelling headphones for deep work',
      cost: 500,
      image_url: 'headphones.png',
      type: 'physical'
    },
    {
      id: '4',
      name: 'Amazon Gift Card',
      description: 'Amazon Gift Card worth ₹500',
      cost: 5000,
      image_url: 'amazon.png',
      type: 'digital',
      isGiftCard: true
    },
    {
      id: '5',
      name: 'BookMyShow Voucher',
      description: 'BookMyShow voucher worth ₹300',
      cost: 3000,
      image_url: 'bookmyshow.png',
      type: 'digital',
      isGiftCard: true
    },
    {
      id: '6',
      name: 'Aha OTT Subscription',
      description: '1 Month Premium Subscription',
      cost: 999,
      image_url: 'aha.png',
      type: 'digital',
      isGiftCard: true
    },
    {
      id: '7',
      name: 'Udemy Voucher',
      description: '₹400 Discount on Any Course',
      cost: 4000,
      image_url: 'udemy.png',
      type: 'digital',
      isGiftCard: true
    },
    {
      id: '8',
      name: 'WROGN T-Shirt',
      description: 'Stylish Designer T-Shirt',
      cost: 5000,
      image_url: 'wrogn.png',
      type: 'physical'
    },
    {
      id: '9',
      name: 'WROGN Watch',
      description: 'Premium Analog Watch with Leather Strap',
      cost: 6000,
      image_url: 'watch.png',
      type: 'physical'
    },
    {
      id: '10',
      name: 'Cosmetics Set',
      description: 'Premium Beauty & Makeup Collection',
      cost: 4000,
      image_url: 'cosmetics.png',
      type: 'physical'
    }
  ],
  loading: false,
  error: null,
  generateGiftCode,

  fetchItems: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('store_items')
        .select('*');

      if (error) throw error;
      set({ items: data || get().items });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  purchaseItem: async (itemId: string, shippingDetails?: ShippingDetails) => {
    try {
      set({ loading: true });
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('User not authenticated');

      const item = get().items.find(i => i.id === itemId);
      if (!item) throw new Error('Item not found');

      // Check if user has enough coins
      const { coins, removeCoins } = useCoinsStore.getState();
      if (coins < item.cost) {
        throw new Error('Not enough coins');
      }

      let giftCode;
      if (item.isGiftCard) {
        giftCode = generateGiftCode();
      }

      // Record the purchase first
      const { addPurchase } = usePurchasesStore.getState();
      await addPurchase({
        id: item.id,
        name: item.name,
        cost: item.cost,
        shipping_details: item.type === 'physical' ? shippingDetails : undefined,
        gift_code: giftCode
      });

      // Remove coins after successful purchase recording
      await removeCoins(item.cost);

      set({ error: null });
      return { giftCode };
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
})); 