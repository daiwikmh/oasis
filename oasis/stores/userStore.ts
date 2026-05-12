import { create } from "zustand";

export type KycTier = "none" | "basic" | "full";

interface UserState {
  kycTier: KycTier;
  setKycTier: (tier: KycTier) => void;
  displayName: string;
  setDisplayName: (name: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  kycTier: "none",
  setKycTier: (tier) => set({ kycTier: tier }),
  displayName: "",
  setDisplayName: (name) => set({ displayName: name }),
}));
