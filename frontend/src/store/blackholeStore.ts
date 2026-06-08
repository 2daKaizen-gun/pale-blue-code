import { create } from 'zustand'

export type LensingSteps = 64 | 96 | 128

interface BlackholeState {
  mass: number
  steps: LensingSteps
  diskVisible: boolean
  showHorizon: boolean
  setMass: (mass: number) => void
  setSteps: (steps: LensingSteps) => void
  setDiskVisible: (v: boolean) => void
  setShowHorizon: (v: boolean) => void
}

export const useBlackholeStore = create<BlackholeState>((set) => ({
  mass: 1.0,
  steps: 64,
  diskVisible: false,
  showHorizon: false,
  setMass: (mass) => set({ mass }),
  setSteps: (steps) => set({ steps }),
  setDiskVisible: (diskVisible) => set({ diskVisible }),
  setShowHorizon: (showHorizon) => set({ showHorizon }),
}))
