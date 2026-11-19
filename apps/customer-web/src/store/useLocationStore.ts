import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SERVICEABLE_PINCODES } from '@buildora/constants';

interface LocationStoreState {
  pincode: string;
  cityName: string;
  isServiceable: boolean;
  etaMinutes: number;
  warehouse: string;
  isModalOpen: boolean;
  checkAndSetPincode: (pincode: string) => { serviceable: boolean; message: string };
  openLocationModal: () => void;
  closeLocationModal: () => void;
}

export const useLocationStore = create<LocationStoreState>()(
  persist(
    (set) => ({
      pincode: '560038',
      cityName: 'Indiranagar, Bengaluru',
      isServiceable: true,
      etaMinutes: 60,
      warehouse: 'WH-BLR-01',
      isModalOpen: false,

      checkAndSetPincode: (code: string) => {
        const cleaned = code.trim();
        const found = SERVICEABLE_PINCODES[cleaned];

        if (found) {
          set({
            pincode: cleaned,
            cityName: found.city,
            isServiceable: true,
            etaMinutes: found.etaMinutes,
            warehouse: found.warehouse,
            isModalOpen: false
          });
          return {
            serviceable: true,
            message: `Delivery available in ${found.etaMinutes} minutes to ${found.city}!`
          };
        } else {
          set({
            pincode: cleaned,
            cityName: 'Out of Quick Delivery Area',
            isServiceable: false,
            etaMinutes: 0,
            warehouse: ''
          });
          return {
            serviceable: false,
            message: `Pincode ${cleaned} is currently outside our 60-minute quick-commerce zone. Scheduled multi-day freight may apply.`
          };
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
