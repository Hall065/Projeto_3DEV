import { create } from 'zustand';

interface FilterState {
  search: string;
  status: string | null;
  periodo: string | null;
  setSearch: (search: string) => void;
  setStatus: (status: string | null) => void;
  setPeriodo: (periodo: string | null) => void;
  reset: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  search: '',
  status: null,
  periodo: null,
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status }),
  setPeriodo: (periodo) => set({ periodo }),
  reset: () => set({ search: '', status: null, periodo: null }),
}));
