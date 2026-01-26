import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  activeTab: string;
  theme: 'light' | 'dark';
  notifications: number;
  searchOpen: boolean;
  filterDrawerOpen: boolean;
}

const initialState: UiState = {
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  activeTab: 'home',
  theme: 'light',
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
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
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
  toggleTheme,
  setNotifications,
  decrementNotifications,
  toggleSearch,
  setSearchOpen,
  toggleFilterDrawer,
  setFilterDrawerOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
