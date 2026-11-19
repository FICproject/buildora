import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, ProjectType, Product } from '@buildora/types';
import { useCartStore } from './useCartStore';

interface ProjectStoreState {
  projects: Project[];
  createProject: (data: {
    title: string;
    type: ProjectType;
    location: string;
    pincode: string;
    startDate: string;
    budget: number;
    notes?: string;
  }) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addMaterialToProject: (projectId: string, product: Product, estimatedQuantity: number) => void;
  removeMaterialFromProject: (projectId: string, materialItemId: string) => void;
  addProjectMaterialsToCart: (projectId: string) => number;
}

const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Indiranagar 3BHK Renovation',
    type: 'HOME_RENOVATION',
    location: 'Indiranagar, Bengaluru',
    pincode: '560038',
    startDate: '2026-12-01',
    budget: 350000,
    notes: 'Complete tile replacement in living and dining rooms, waterproofing terrace, and modular kitchen hardware overhaul.',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    materials: [
      {
        id: 'mat-1',
        productId: 'prod-tile-1',
        productName: 'Kajaria Double Charge Glazed Vitrified Tiles (2x2 ft)',
        productSlug: 'kajaria-double-charge-vitrified-tiles-600x600',
        brand: 'Kajaria Ceramics',
        unit: 'Box (4 Tiles)',
        price: 880,
        estimatedQuantity: 25,
        totalCost: 22000,
        image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'mat-2',
        productId: 'prod-tile-2',
        productName: 'Roff T01 Tile Bonder Polymer Adhesive (20 kg)',
        productSlug: 'roff-t01-tile-bonder-adhesive-20kg',
        brand: 'Pidilite (Fevicol & Dr. Fixit)',
        unit: '20 kg Bag',
        price: 360,
        estimatedQuantity: 8,
        totalCost: 2880,
        image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80'
      },
      {
        id: 'mat-3',
        productId: 'prod-wat-1',
        productName: 'Dr. Fixit 101 LW+ Integral Liquid Waterproofing Compound (5 Litre)',
        productSlug: 'dr-fixit-101-lw-plus-integral-waterproofing-5l',
        brand: 'Pidilite (Fevicol & Dr. Fixit)',
        unit: '5 Litre Can',
        price: 740,
        estimatedQuantity: 4,
        totalCost: 2960,
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80'
      }
    ]
  }
];

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set, get) => ({
      projects: DEMO_PROJECTS,

      createProject: (data) => {
        const id = 'proj-' + Date.now();
        const newProj: Project = {
          ...data,
          id,
          materials: [],
          createdAt: new Date().toISOString()
        };
        set((state) => ({ projects: [newProj, ...state.projects] }));
        return newProj;
      },

      updateProject: (id, data) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p))
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id)
        }));
      },

      addMaterialToProject: (projectId, product, estimatedQuantity) => {
        const matId = 'mat-' + Date.now();
        const totalCost = product.price * estimatedQuantity;
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const updated = [
              ...p.materials,
              {
                id: matId,
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                brand: product.brand,
                unit: product.unit,
                price: product.price,
                estimatedQuantity,
                totalCost,
                image: product.images[0] || ''
              }
            ];
            return { ...p, materials: updated };
          })
        }));
      },

      removeMaterialFromProject: (projectId, materialItemId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              materials: p.materials.filter((m) => m.id !== materialItemId)
            };
          })
        }));
      },

      addProjectMaterialsToCart: (projectId) => {
        const proj = get().projects.find((p) => p.id === projectId);
        if (!proj || proj.materials.length === 0) return 0;

        const cart = useCartStore.getState();
        let addedCount = 0;

        for (const mat of proj.materials) {
          // Construct minimal product reference for cart
          const mockProd: any = {
            id: mat.productId,
            name: mat.productName,
            slug: mat.productSlug,
            sku: 'SKU-' + mat.productId,
            brand: mat.brand,
            images: [mat.image],
            unit: mat.unit,
            price: mat.price,
            mrp: Math.round(mat.price * 1.15),
            gstRate: 18,
            stockCount: 100,
            inStock: true
          };
          cart.addItem(mockProd, mat.estimatedQuantity);
          addedCount += mat.estimatedQuantity;
        }

        return addedCount;
      }
    }),
    {
      name: 'buildora-projects-storage'
    }
  )
);
