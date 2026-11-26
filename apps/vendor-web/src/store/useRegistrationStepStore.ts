import { create } from 'zustand';

export type StepDirection = 'forward' | 'backward';

interface RegistrationStepState {
  activeStep: number;
  direction: StepDirection;
  setActiveStep: (step: number) => void;
  resetStep: () => void;
}

export const useRegistrationStepStore = create<RegistrationStepState>((set) => ({
  activeStep: 1,
  direction: 'forward',
  setActiveStep: (step) =>
    set((state) => {
      const clamped = Math.max(1, Math.min(5, step));
      if (clamped === state.activeStep) return state;
      return {
        activeStep: clamped,
        direction: clamped >= state.activeStep ? 'forward' : 'backward',
      };
    }),
  resetStep: () => set({ activeStep: 1, direction: 'forward' }),
}));
