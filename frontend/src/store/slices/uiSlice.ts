import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark' | 'system';

interface UiState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  activeTab: string;
  theme: Theme;
  notifications: number;
  searchOpen: boolean;
  filterDrawerOpen: boolean;
}

// Load initial theme from localStorage if available
const getInitialTheme = (): Theme => {
  try {
    const savedTheme = localStorage.getItem('nearo-theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
  } catch (e) {
    // Ignore error
  }
  return 'system';
};

const initialState: UiState = {
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  activeTab: 'home',
  theme: getInitialTheme(),
  notifications: 3,
  searchOpen: false,
  filterDrawerOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setNotifications: (state, action: PayloadAction<number>) => {
      state.notifications = action.payload;
    },
    decrementNotifications: (state) => {
      if (state.notifications > 0) {
        state.notifications--;
      }
    },
    toggleSearch: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
    },
    toggleFilterDrawer: (state) => {
      state.filterDrawerOpen = !state.filterDrawerOpen;
    },
    setFilterDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.filterDrawerOpen = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  setActiveTab,
  setTheme,
  setNotifications,
  decrementNotifications,
  toggleSearch,
  setSearchOpen,
  toggleFilterDrawer,
  setFilterDrawerOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
