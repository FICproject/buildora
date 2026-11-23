import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SERVICEABLE_PINCODES, checkBengaluruServiceability, ServiceabilityResult } from '@buildora/constants';
import { api } from '../services/api';

export interface LocationState {
  pincode: string;
  locality: string;
  cityName: string;
  state: string;
  isServiceable: boolean;
  etaMinutes: number;
  etaText: string;
  warehouse: string;
  warehouseName: string;
  dispatchStatus: 'ACTIVE_DISPATCH' | 'SCHEDULED_DISPATCH' | 'UNDER_VERIFICATION' | 'UNSERVICEABLE';
  isModalOpen: boolean;
  isLoading: boolean;
  lastVerifiedAt: string;

  selectedAddressId?: string | null;
  selectedAddressLabel?: string | null;
  selectedAddressFull?: string | null;

  checkAndSetPincode: (code: string, preserveAddressDetails?: boolean) => Promise<{ serviceable: boolean; message: string; locality: string; etaMinutes: number }>;
  detectCurrentLocation: () => Promise<{ success: boolean; message: string }>;
  selectSavedAddress: (address: { id?: string; label?: string; fullAddress?: string; pincode: string; locality?: string; city?: string }) => Promise<void>;
  openLocationModal: () => void;
  closeLocationModal: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      pincode: '560072',
      locality: 'Nagarabhavi / Bengaluru West',
      cityName: 'Bengaluru',
      state: 'Karnataka',
      isServiceable: true,
      etaMinutes: 60,
      etaText: 'Estimated delivery: 60 minutes',
      warehouse: 'WH-BLR-04',
      warehouseName: 'Bengaluru West Dark Store (Nagarabhavi / Peenya)',
      dispatchStatus: 'ACTIVE_DISPATCH',
      selectedAddressId: 'addr-1',
      selectedAddressLabel: 'Home',
      selectedAddressFull: 'ikuytredsfghj, 2nd Stage, Nagarbhavi, Bengaluru, Karnataka 560072, Bengaluru, 560072',
      isModalOpen: false,
      isLoading: false,
      lastVerifiedAt: new Date().toISOString(),

      checkAndSetPincode: async (code: string, preserveAddressDetails = false) => {
        const cleaned = (code || '').toString().trim();
        if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
          return {
            serviceable: false,
            message: 'Please enter a valid 6-digit Indian PIN code.',
            locality: '',
            etaMinutes: 0
          };
        }

        set({
          isLoading: true,
          ...(preserveAddressDetails
            ? {}
            : {
                selectedAddressId: null,
                selectedAddressLabel: null,
                selectedAddressFull: null
              })
        });

        // 1. Try Backend API first
        try {
          const remote = await api.checkServiceability(cleaned);
          if (remote && remote.pincode === cleaned) {
            const loc = remote.locality || remote.cityName || remote.city || 'Bengaluru Urban';
            const city = remote.cityName || remote.city || 'Bengaluru';
            const eta = typeof remote.etaMinutes === 'number' ? remote.etaMinutes : (typeof remote.estimatedMinutes === 'number' ? remote.estimatedMinutes : 60);
            const serviceable = typeof remote.isServiceable === 'boolean'
              ? remote.isServiceable
              : (typeof remote.serviceable === 'boolean' ? remote.serviceable : false);
            const wh = remote.warehouseId || remote.warehouse || 'WH-BLR-01';
            const whName = remote.warehouseName || (wh === 'WH-BLR-04' ? 'Bengaluru West Hub (Nagarabhavi / Peenya)' : 'Bengaluru Central Dark Store');
            const dispatch = remote.dispatchStatus || (serviceable ? (eta <= 90 ? 'ACTIVE_DISPATCH' : 'SCHEDULED_DISPATCH') : 'UNSERVICEABLE');

            set({
              pincode: cleaned,
              locality: loc,
              cityName: city,
              state: remote.state || 'Karnataka',
              isServiceable: serviceable,
              etaMinutes: eta,
              etaText: remote.etaText || (serviceable ? `Estimated delivery: ${eta} minutes` : 'Non-Serviceable Location'),
              warehouse: wh,
              warehouseName: whName,
              dispatchStatus: dispatch,
              isLoading: false,
              lastVerifiedAt: new Date().toISOString()
            });

            return {
              serviceable,
              message: remote.message || (serviceable ? `Delivery available in ${eta} minutes to ${loc}!` : `PIN code ${cleaned} is outside our Bengaluru delivery network.`),
              locality: loc,
              etaMinutes: eta
            };
          }
        } catch {
          // Backend call failed or offline; gracefully fall back to centralized client lookup
        }

        // 2. Authoritative client fallback using centralized Bengaluru Coverage logic
        const local = checkBengaluruServiceability(cleaned);
        set({
          pincode: cleaned,
          locality: local.locality,
          cityName: local.cityName,
          state: local.state,
          isServiceable: local.isServiceable,
          etaMinutes: local.etaMinutes,
          etaText: local.etaText,
          warehouse: local.warehouseId || '',
          warehouseName: local.warehouseName || '',
          dispatchStatus: local.dispatchStatus,
          isLoading: false,
          lastVerifiedAt: new Date().toISOString()
        });

        return {
          serviceable: local.isServiceable,
          message: local.message,
          locality: local.locality,
          etaMinutes: local.etaMinutes
        };
      },

      detectCurrentLocation: async () => {
        set({
          isLoading: true,
          selectedAddressId: null,
          selectedAddressLabel: null,
          selectedAddressFull: null
        });
        return new Promise((resolve) => {
          if (!('geolocation' in navigator)) {
            set({ isLoading: false });
            resolve({
              success: false,
              message: 'Browser geolocation is not supported on this device.'
            });
            return;
          }

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              // Check if within Bengaluru bounding box: lat ~ 12.75 - 13.25, lon ~ 77.35 - 77.85
              const isBengaluru = latitude >= 12.75 && latitude <= 13.25 && longitude >= 77.35 && longitude <= 77.85;

              if (isBengaluru) {
                // Determine closest quadrant
                let detectedPincode = '560038'; // Default central Indiranagar
                if (longitude < 77.53) {
                  detectedPincode = '560072'; // West / Nagarabhavi
                } else if (latitude < 12.93) {
                  detectedPincode = '560102'; // South / HSR
                } else if (latitude > 13.03) {
                  detectedPincode = '560024'; // North / Hebbal
                } else if (longitude > 77.65) {
                  detectedPincode = '560066'; // East / Whitefield
                }

                await get().checkAndSetPincode(detectedPincode);
                set({ isLoading: false, isModalOpen: false });
                resolve({
                  success: true,
                  message: `Detected location within Bengaluru site dispatch network (${detectedPincode}).`
                });
              } else {
                // Default to Bengaluru West / Nagarabhavi hub
                await get().checkAndSetPincode('560072');
                set({ isLoading: false, isModalOpen: false });
                resolve({
                  success: true,
                  message: 'Position detected. Connected to Bengaluru West Hub.'
                });
              }
            },
            (error) => {
              set({ isLoading: false });
              resolve({
                success: false,
                message: error.message || 'GPS location permission denied. Please enter pincode manually.'
              });
            },
            { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
          );
        });
      },

      selectSavedAddress: async (address) => {
        if (address.pincode) {
          const label = address.label || 'Job Site';
          const area = address.locality || address.city || 'Bengaluru';
          const full = address.fullAddress || `${label} - ${area}, ${address.pincode}`;
          set({
            selectedAddressId: address.id || null,
            selectedAddressLabel: label,
            selectedAddressFull: full,
            isModalOpen: false
          });
          await get().checkAndSetPincode(address.pincode, true);
        }
      },

      openLocationModal: () => set({ isModalOpen: true }),
      closeLocationModal: () => set({ isModalOpen: false })
    }),
    {
      name: 'buildora-location-storage'
    }
  )
);
