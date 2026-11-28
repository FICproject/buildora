import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant, Coupon, DeliverySpeed } from '@buildora/types';
import { calculateBulkDiscount, calculateCartSummary, UnloadingServiceOptions } from '@buildora/utils';
import { api } from '../services/api';
import { useStoreConfigStore } from './useStoreConfigStore';

function hasAuthToken(): boolean {
  try {
    const raw = localStorage.getItem('buildora-auth-storage');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed?.state?.isAuthenticated && parsed?.state?.token);
  } catch {
    return false;
  }
}

interface CartStoreState {
  items: CartItem[];
  mergeAdjustments: string[];
  coupon: Coupon | null;
  deliverySpeed: DeliverySpeed;
  unloadingOptions: UnloadingServiceOptions;
  walletBalanceToUse: number;
  gstin?: string;
  companyName?: string;
  saveGstToProfile?: boolean;
  setGstin: (gstin: string, companyName?: string, saveToProfile?: boolean) => void;
  removeGstin: () => void;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearMergeAdjustments: () => void;
  syncMergeWithServer: () => Promise<{ items: CartItem[]; adjustments: string[] }>;
  applyCoupon: (couponCode: string, serverCoupon?: Coupon | null) => { success: boolean; message: string };
  removeCoupon: () => void;
  setDeliverySpeed: (speed: DeliverySpeed) => void;
  setUnloadingOptions: (opts: Partial<UnloadingServiceOptions>) => void;
  setWalletBalanceToUse: (amount: number) => void;
  clearCart: () => void;
  getSummary: () => ReturnType<typeof calculateCartSummary>;
  syncWithBackend: () => Promise<any>;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      mergeAdjustments: [],
      coupon: null,
      deliverySpeed: 'ASAP_60',
      unloadingOptions: {
        required: false,
        floor: 0,
        hasLift: true,
        siteInstructions: ''
      },
      walletBalanceToUse: 0,

      addItem: (product, quantity = 1, variant) => {
        set((state) => {
          const effectivePrice = variant ? variant.price : product.price;
          const effectiveMrp = variant ? variant.mrp : product.mrp;
          const variantId = variant?.id;
          const maxStock = variant ? variant.stock : product.stockCount;

          const existingIndex = state.items.findIndex(
            (item) => item.productId === product.id && (item.variantId || undefined) === (variantId || undefined)
          );

          let updatedItems: CartItem[];

          if (existingIndex > -1) {
            const existing = state.items[existingIndex];
            const newQty = Math.min(existing.quantity + quantity, maxStock);
            const bulkDiscount = calculateBulkDiscount(newQty, product.bulkPricing);
            const effectiveUnit = effectivePrice * (1 - bulkDiscount / 100);

            updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...existing,
              categorySlug: product.categorySlug,
              quantity: newQty,
              bulkDiscountPercentage: bulkDiscount,
              effectiveUnitPrice: Math.round(effectiveUnit),
              totalPrice: Math.round(effectiveUnit * newQty)
            };
          } else {
            const initialQty = Math.min(quantity, maxStock);
            const bulkDiscount = calculateBulkDiscount(initialQty, product.bulkPricing);
            const effectiveUnit = effectivePrice * (1 - bulkDiscount / 100);

            const newItem: CartItem = {
              productId: product.id,
              variantId,
              categorySlug: product.categorySlug,
              sku: variant ? variant.sku : product.sku,
              name: product.name + (variant ? ` (${variant.name})` : ''),
              slug: product.slug,
              brand: product.brand,
              image: variant?.image || product.images[0] || '',
              unit: variant?.name || product.unit,
              price: effectivePrice,
              mrp: effectiveMrp,
              gstRate: product.gstRate,
              quantity: initialQty,
              bulkDiscountPercentage: bulkDiscount,
              effectiveUnitPrice: Math.round(effectiveUnit),
              totalPrice: Math.round(effectiveUnit * initialQty),
              maxStock,
              selectedOptions: variant?.attributes || (variant ? { Option: variant.name } : undefined)
            };
            updatedItems = [...state.items, newItem];
          }

          return { items: updatedItems };
        });
        if (hasAuthToken()) {
          void api.saveServerCart(get().items);
        }
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && (item.variantId || undefined) === (variantId || undefined))
          )
        }));
        if (hasAuthToken()) {
          void api.saveServerCart(get().items);
        }
      },

      updateQuantity: (productId, quantity, variantId) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter(
                (item) => !(item.productId === productId && (item.variantId || undefined) === (variantId || undefined))
              )
            };
          }

          const updatedItems = state.items.map((item) => {
            if (item.productId === productId && (item.variantId || undefined) === (variantId || undefined)) {
              const clampedQty = Math.max(1, Math.min(quantity, item.maxStock));
              const effectiveUnit = item.price * (1 - item.bulkDiscountPercentage / 100);
              return {
                ...item,
                quantity: clampedQty,
                effectiveUnitPrice: Math.round(effectiveUnit),
                totalPrice: Math.round(effectiveUnit * clampedQty)
              };
            }
            return item;
          });

          return { items: updatedItems };
        });
        if (hasAuthToken()) {
          void api.saveServerCart(get().items);
        }
      },

      clearMergeAdjustments: () => set({ mergeAdjustments: [] }),

      syncMergeWithServer: async () => {
        const currentGuest = get().items;
        if (!hasAuthToken()) return { items: currentGuest, adjustments: [] };
        try {
          const res = await api.mergeServerCart(currentGuest);
          if (res?.success && res.data && Array.isArray(res.data.items)) {
            const existingMap = new Map(
              currentGuest.map((g) => [`${g.productId}::${g.variantId || ''}`, g])
            );
            const mergedItems: CartItem[] = res.data.items.map((srv: any) => {
              const prev = existingMap.get(`${srv.productId}::${srv.variantId || ''}`);
              return {
                ...(prev || {}),
                ...srv,
                price: Number(srv.unitPrice ?? srv.effectiveUnitPrice ?? prev?.price ?? 0),
                effectiveUnitPrice: Number(srv.effectiveUnitPrice ?? srv.unitPrice ?? prev?.effectiveUnitPrice ?? 0),
                mrp: Number(srv.mrp ?? prev?.mrp ?? srv.effectiveUnitPrice ?? 0),
                gstRate: Number(prev?.gstRate ?? 18),
                bulkDiscountPercentage: Number(prev?.bulkDiscountPercentage ?? 0),
                totalPrice: Number(srv.totalPrice ?? Number(srv.effectiveUnitPrice || 0) * Number(srv.quantity || 1)),
              } as CartItem;
            });
            const adjustments = Array.isArray(res.data.adjustments) ? res.data.adjustments : [];
            set({ items: mergedItems, mergeAdjustments: adjustments });
            return { items: mergedItems, adjustments };
          }
        } catch {
          // Retain local cart on offline failure
        }
        return { items: currentGuest, adjustments: [] };
      },

      applyCoupon: (couponCode, serverCoupon) => {
        const dynamicCoupons: Coupon[] = (useStoreConfigStore.getState().config?.coupons || []) as Coupon[];
        const found =
          serverCoupon ||
          dynamicCoupons.find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase());
        if (!found) {
          return { success: false, message: 'Invalid or inactive coupon code.' };
        }

        // Expiry check
        if (found.expiryDate && new Date(found.expiryDate) < new Date()) {
          return { success: false, message: `Coupon code '${found.code}' has expired.` };
        }

        const summary = get().getSummary();
        if (summary.discountedSubtotal < found.minOrderValue) {
          return {
            success: false,
            message: `Coupon '${found.code}' requires a minimum order of ₹${found.minOrderValue.toLocaleString('en-IN')}`
          };
        }

        set({ coupon: found });
        return { success: true, message: `Coupon '${found.code}' applied! Savings: ${found.description}` };
      },

      removeCoupon: () => set({ coupon: null }),

      setDeliverySpeed: (speed) => set({ deliverySpeed: speed }),

      setUnloadingOptions: (opts) =>
        set((state) => ({
          unloadingOptions: { ...state.unloadingOptions, ...opts }
        })),

      setWalletBalanceToUse: (amount) => set({ walletBalanceToUse: amount }),

      setGstin: (gstin, companyName, saveToProfile = false) =>
        set({
          gstin: gstin.trim().toUpperCase(),
          companyName: companyName?.trim() || undefined,
          saveGstToProfile: saveToProfile
        }),

      removeGstin: () =>
        set({
          gstin: undefined,
          companyName: undefined,
          saveGstToProfile: false
        }),

      clearCart: () => {
        set({
          items: [],
          mergeAdjustments: [],
          coupon: null,
          unloadingOptions: { required: false, floor: 0, hasLift: true, siteInstructions: '' },
          walletBalanceToUse: 0,
          gstin: undefined,
          companyName: undefined,
          saveGstToProfile: false
        });
        if (hasAuthToken()) {
          void api.clearServerCart();
        }
      },

      getSummary: () => {
        const state = get();
        const delivCfg = useStoreConfigStore.getState().config?.deliveryConfig;
        return calculateCartSummary({
          items: state.items,
          coupon: state.coupon,
          deliverySpeed: state.deliverySpeed,
          unloadingOptions: state.unloadingOptions,
          walletBalanceToUse: state.walletBalanceToUse,
          freeDeliveryThreshold: delivCfg?.freeShippingThreshold,
          standardDeliveryFee: delivCfg?.defaultShippingCharge,
          baseUnloadingFee: delivCfg?.baseUnloadingFee,
        });
      },

      syncWithBackend: async () => {
        const state = get();
        try {
          const res = await api.calculateCart({
            items: state.items,
            coupon: state.coupon?.code || null,
            deliverySpeed: state.deliverySpeed,
            unloadingOptions: state.unloadingOptions,
            walletBalanceToUse: state.walletBalanceToUse
          });
          return res;
        } catch {
          return null;
        }
      }
    }),
    {
      name: 'buildora-cart-storage'
    }
  )
);
