import { create } from 'zustand';
import { User } from '@/types/user';

interface UserState {
  user: User | null;
  updateProfile: (userData: Partial<User>) => void;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  
  updateProfile: (userData) => 
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),
  
  setUser: (user) => set({ user }),
})); 