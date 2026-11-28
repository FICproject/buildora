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
  isSyncing: boolean;
  cartError: string | null;
  coupon: Coupon | null;
  deliverySpeed: DeliverySpeed;
  unloadingOptions: UnloadingServiceOptions;
  walletBalanceToUse: number;
  gstin?: string;
  companyName?: string;
  saveGstToProfile?: boolean;
  clearCartError: () => void;
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

let latestCartSyncId = 0;

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => {
      const pushCartToServer = () => {
        if (!hasAuthToken()) return;
        const syncId = ++latestCartSyncId;
        set({ isSyncing: true });
        void api
          .saveServerCart(get().items)
          .then((res) => {
            if (syncId !== latestCartSyncId) return;
            if (res && Array.isArray(res.adjustments) && res.adjustments.length > 0) {
              set({ mergeAdjustments: res.adjustments, isSyncing: false });
            } else {
              set({ isSyncing: false });
            }
          })
          .catch((err: any) => {
            if (syncId !== latestCartSyncId) return;
            set({
              isSyncing: false,
              cartError: err?.message || 'Unable to sync cart with server. Saved locally.',
            });
          });
      };

      return {
      items: [],
      mergeAdjustments: [],
      isSyncing: false,
      cartError: null,
      coupon: null,
      deliverySpeed: 'ASAP_60',
      unloadingOptions: {
        required: false,
        floor: 0,
        hasLift: true,
        siteInstructions: ''
      },
      walletBalanceToUse: 0,

      clearCartError: () => set({ cartError: null }),

      addItem: (product, quantity = 1, variant) => {
        let didMutate = false;
        set((state) => {
          const effectivePrice = variant ? variant.price : product.price;
          const effectiveMrp = variant ? variant.mrp : product.mrp;
          const variantId = variant?.id;
          const maxStock = Math.max(0, Number(variant ? variant.stock : product.stockCount) || 0);
          const moq = Math.max(1, Number((variant as any)?.moq ?? product.moq ?? 1));

          if (maxStock <= 0 || !product.inStock || (variant && !variant.inStock)) {
            return {
              cartError: `${product.name} is currently out of stock.`,
            };
          }

          const existingIndex = state.items.findIndex(
            (item) => item.productId === product.id && (item.variantId || undefined) === (variantId || undefined)
          );

          let updatedItems: CartItem[];

          if (existingIndex > -1) {
            const existing = state.items[existingIndex];
            if (existing.quantity >= maxStock) {
              return {
                cartError: `Maximum available stock (${maxStock}) reached for ${existing.name}.`,
              };
            }
            const newQty = Math.min(existing.quantity + quantity, maxStock);
            const bulkTiers = product.bulkPricing ?? existing.bulkPricing;
            const bulkDiscount = calculateBulkDiscount(newQty, bulkTiers);
            const effectiveUnit = effectivePrice * (1 - bulkDiscount / 100);

            updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...existing,
              categorySlug: product.categorySlug,
              quantity: newQty,
              moq,
              maxStock,
              bulkPricing: bulkTiers,
              bulkDiscountPercentage: bulkDiscount,
              effectiveUnitPrice: Math.round(effectiveUnit),
              totalPrice: Math.round(effectiveUnit * newQty)
            };
            didMutate = true;
          } else {
            const initialQty = Math.min(Math.max(quantity, moq), maxStock);
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
              moq,
              bulkPricing: product.bulkPricing,
              bulkDiscountPercentage: bulkDiscount,
              effectiveUnitPrice: Math.round(effectiveUnit),
              totalPrice: Math.round(effectiveUnit * initialQty),
              maxStock,
              selectedOptions: variant?.attributes || (variant ? { Option: variant.name } : undefined)
            };
            updatedItems = [...state.items, newItem];
            didMutate = true;
          }

          return { items: updatedItems, cartError: null };
        });
        if (didMutate) {
          pushCartToServer();
        }
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.productId === productId && (item.variantId || undefined) === (variantId || undefined))
          ),
          cartError: null,
        }));
        pushCartToServer();
      },

      updateQuantity: (productId, quantity, variantId) => {
        let didMutate = false;
        set((state) => {
          const target = state.items.find(
            (item) => item.productId === productId && (item.variantId || undefined) === (variantId || undefined)
          );
          if (!target) return state;

          const itemMoq = Math.max(1, Number(target.moq ?? 1));
          const maxStock = Math.max(0, Number(target.maxStock ?? 0));

          if (quantity <= 0 || (quantity < target.quantity && quantity < itemMoq)) {
            didMutate = true;
            return {
              items: state.items.filter(
                (item) => !(item.productId === productId && (item.variantId || undefined) === (variantId || undefined))
              ),
              cartError: null,
            };
          }

          if (maxStock > 0 && quantity > maxStock) {
            return {
              cartError: `Maximum available stock (${maxStock}) reached for ${target.name}.`,
            };
          }

          const clampedQty = maxStock > 0 ? Math.max(itemMoq, Math.min(quantity, maxStock)) : Math.max(1, quantity);
          didMutate = true;

          const updatedItems = state.items.map((item) => {
            if (item.productId === productId && (item.variantId || undefined) === (variantId || undefined)) {
              const bulkDiscount = calculateBulkDiscount(clampedQty, item.bulkPricing);
              const effectiveUnit = item.price * (1 - bulkDiscount / 100);
              return {
                ...item,
                quantity: clampedQty,
                bulkDiscountPercentage: bulkDiscount,
                effectiveUnitPrice: Math.round(effectiveUnit),
                totalPrice: Math.round(effectiveUnit * clampedQty)
              };
            }
            return item;
          });

          return { items: updatedItems, cartError: null };
        });
        if (didMutate) {
          pushCartToServer();
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
                price: Number(srv.price ?? srv.unitPrice ?? srv.effectiveUnitPrice ?? prev?.price ?? 0),
                effectiveUnitPrice: Number(srv.effectiveUnitPrice ?? srv.unitPrice ?? prev?.effectiveUnitPrice ?? 0),
                mrp: Number(srv.mrp ?? prev?.mrp ?? srv.effectiveUnitPrice ?? 0),
                gstRate: Number(srv.gstRate ?? prev?.gstRate ?? 18),
                moq: Number(srv.moq ?? prev?.moq ?? 1),
                bulkPricing: srv.bulkPricing ?? prev?.bulkPricing,
                bulkDiscountPercentage: Number(srv.bulkDiscountPercentage ?? prev?.bulkDiscountPercentage ?? 0),
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
      };
    },
    {
      name: 'buildora-cart-storage',
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon,
        deliverySpeed: state.deliverySpeed,
        unloadingOptions: state.unloadingOptions,
        walletBalanceToUse: state.walletBalanceToUse,
        gstin: state.gstin,
        companyName: state.companyName,
        saveGstToProfile: state.saveGstToProfile,
      }),
    }
  )
);
