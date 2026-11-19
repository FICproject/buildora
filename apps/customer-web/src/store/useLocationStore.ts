import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SERVICEABLE_PINCODES } from '@buildora/constants';
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

  checkAndSetPincode: (code: string) => Promise<{ serviceable: boolean; message: string; locality: string; etaMinutes: number }>;
  detectCurrentLocation: () => Promise<{ success: boolean; message: string }>;
  selectSavedAddress: (address: { pincode: string; locality?: string; city?: string }) => Promise<void>;
  openLocationModal: () => void;
  closeLocationModal: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      pincode: '560072',
      locality: 'Nagarabhavi',
      cityName: 'Bengaluru',
      state: 'Karnataka',
      isServiceable: true,
      etaMinutes: 60,
      etaText: 'Estimated delivery: 60 minutes',
      warehouse: 'WH-BLR-04',
      warehouseName: 'Bengaluru West Hub (Nagarabhavi / Peenya)',
      dispatchStatus: 'ACTIVE_DISPATCH',
      isModalOpen: false,
      isLoading: false,
      lastVerifiedAt: new Date().toISOString(),

      checkAndSetPincode: async (code: string) => {
        const cleaned = code.trim();
        if (!/^[1-9][0-9]{5}$/.test(cleaned)) {
          return {
            serviceable: false,
            message: 'Please enter a valid 6-digit Indian PIN code.',
            locality: '',
            etaMinutes: 0
          };
        }

        set({ isLoading: true });

        // 1. Try Backend API first
        try {
          const remote = await api.checkServiceability(cleaned);
          if (remote && remote.pincode === cleaned) {
            set({
              pincode: cleaned,
              locality: remote.locality,
              cityName: remote.cityName,
              state: remote.state,
              isServiceable: remote.isServiceable,
              etaMinutes: remote.etaMinutes,
              etaText: remote.etaText || (remote.etaMinutes > 0 ? `Estimated delivery: ${remote.etaMinutes} minutes` : 'Verification In Progress'),
              warehouse: remote.warehouseId || '',
              warehouseName: remote.warehouseName || '',
              dispatchStatus: remote.dispatchStatus || (remote.isServiceable ? 'ACTIVE_DISPATCH' : 'UNDER_VERIFICATION'),
              isLoading: false,
              lastVerifiedAt: new Date().toISOString()
            });

            return {
              serviceable: remote.isServiceable,
              message: remote.message,
              locality: remote.locality,
              etaMinutes: remote.etaMinutes
            };
          }
        } catch {
          // Backend call failed or offline; gracefully fall back to client database
        }

        // 2. Direct match in local Master Pincodes Registry
        const known = (SERVICEABLE_PINCODES as Record<string, any>)[cleaned];
        if (known) {
          const eta = known.etaMinutes || 60;
          set({
            pincode: cleaned,
            locality: known.locality || known.city.split(',')[0],
            cityName: 'Bengaluru',
            state: known.state || 'Karnataka',
            isServiceable: true,
            etaMinutes: eta,
            etaText: `Estimated delivery: ${eta} minutes`,
            warehouse: known.warehouse || 'WH-BLR-01',
            warehouseName: known.warehouse === 'WH-BLR-04' ? 'Bengaluru West Hub (Nagarabhavi)' : 'Bengaluru Central Dark Store',
            dispatchStatus: 'ACTIVE_DISPATCH',
            isLoading: false,
            lastVerifiedAt: new Date().toISOString()
          });

          return {
            serviceable: true,
            message: `Delivery available in ${eta} minutes to ${known.locality || known.city}!`,
            locality: known.locality || known.city,
            etaMinutes: eta
          };
        }

        // 3. Fallback for any Bengaluru Metro PIN (560xxx)
        if (cleaned.startsWith('560')) {
          const sub = parseInt(cleaned.substring(3), 10);
          let locality = 'Bengaluru Urban';
          let wh = 'WH-BLR-01';
          let eta = 60;

          if (sub >= 10 && sub <= 22) {
            locality = 'Bengaluru West (Rajajinagar / Yeshwanthpur)';
            wh = 'WH-BLR-04';
          } else if (sub >= 23 && sub <= 33) {
            locality = 'Bengaluru North (Hebbal / RT Nagar)';
            wh = 'WH-BLR-05';
          } else if (sub >= 34 && sub <= 45) {
            locality = 'Bengaluru South (Koramangala / Banaswadi)';
            wh = 'WH-BLR-02';
          } else if (sub >= 60 && sub <= 75) {
            locality = 'Bengaluru West (Nagarabhavi / Kengeri)';
            wh = 'WH-BLR-04';
          } else if (sub >= 76 && sub <= 104) {
            locality = 'Bengaluru South (Bannerghatta / HSR / Electronic City)';
            wh = 'WH-BLR-02';
            eta = 90;
          }

          set({
            pincode: cleaned,
            locality,
            cityName: 'Bengaluru',
            state: 'Karnataka',
            isServiceable: true,
            etaMinutes: eta,
            etaText: `Estimated delivery: ${eta} minutes`,
            warehouse: wh,
            warehouseName: 'Bengaluru Quick Commerce Dark Store',
            dispatchStatus: 'ACTIVE_DISPATCH',
            isLoading: false,
            lastVerifiedAt: new Date().toISOString()
          });

          return {
            serviceable: true,
            message: `Delivery available in ~${eta} minutes from nearest Bengaluru hub.`,
            locality,
            etaMinutes: eta
          };
        }

        // 4. Greater Bengaluru Rural (562xxx)
        if (cleaned.startsWith('562')) {
          const locality = 'Bengaluru Rural Growth Corridor';
          set({
            pincode: cleaned,
            locality,
            cityName: 'Bengaluru Rural',
            state: 'Karnataka',
            isServiceable: true,
            etaMinutes: 120,
            etaText: 'Estimated delivery: 120 minutes',
            warehouse: 'WH-BLR-05',
            warehouseName: 'Bengaluru Peripheral Logistics Dark Store',
            dispatchStatus: 'SCHEDULED_DISPATCH',
            isLoading: false,
            lastVerifiedAt: new Date().toISOString()
          });

          return {
            serviceable: true,
            message: 'Scheduled site delivery available in 120 minutes.',
            locality,
            etaMinutes: 120
          };
        }

        // 5. Outside Bengaluru / Regional
        set({
          pincode: cleaned,
          locality: 'Regional Location',
          cityName: 'Outside Bengaluru',
          state: 'India',
          isServiceable: false,
          etaMinutes: 0,
          etaText: 'Verification In Progress',
          warehouse: '',
          warehouseName: '',
          dispatchStatus: 'UNDER_VERIFICATION',
          isLoading: false,
          lastVerifiedAt: new Date().toISOString()
        });

        return {
          serviceable: false,
          message: 'Delivery availability is being verified for your location.',
          locality: 'Regional Location',
          etaMinutes: 0
        };
      },

      detectCurrentLocation: async () => {
        set({ isLoading: true });
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
          await get().checkAndSetPincode(address.pincode);
          set({ isModalOpen: false });
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
