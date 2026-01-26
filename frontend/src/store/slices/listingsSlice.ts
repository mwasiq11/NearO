import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ServiceListing, SearchFilters, ServiceCategory } from '@/models/types';

interface ListingsState {
  listings: ServiceListing[];
  myListings: ServiceListing[];
  featuredListings: ServiceListing[];
  trendingListings: ServiceListing[];
  categories: ServiceCategory[];
  currentListing: ServiceListing | null;
  filters: SearchFilters;
  isLoading: boolean;
  error: string | null;
}

const initialState: ListingsState = {
  listings: [],
  myListings: [],
  featuredListings: [],
  trendingListings: [],
  categories: [],
  currentListing: null,
  filters: {
    query: '',
    radius: 10,
    sortBy: 'relevance',
  },
  isLoading: false,
  error: null,
};

const listingsSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    setListings: (state, action: PayloadAction<ServiceListing[]>) => {
      state.listings = action.payload;
    },
    setFeaturedListings: (state, action: PayloadAction<ServiceListing[]>) => {
      state.featuredListings = action.payload;
    },
    setTrendingListings: (state, action: PayloadAction<ServiceListing[]>) => {
      state.trendingListings = action.payload;
    },
    setCategories: (state, action: PayloadAction<ServiceCategory[]>) => {
      state.categories = action.payload;
    },
    setMyListings: (state, action: PayloadAction<ServiceListing[]>) => {
      state.myListings = action.payload;
    },
    addListing: (state, action: PayloadAction<ServiceListing>) => {
      state.listings.unshift(action.payload);
      state.myListings.unshift(action.payload);
    },
    updateListing: (state, action: PayloadAction<ServiceListing>) => {
      const index = state.listings.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.listings[index] = action.payload;
      }
      const myIndex = state.myListings.findIndex(l => l.id === action.payload.id);
      if (myIndex !== -1) {
        state.myListings[myIndex] = action.payload;
      }
    },
    deleteListing: (state, action: PayloadAction<string>) => {
      state.listings = state.listings.filter(l => l.id !== action.payload);
      state.myListings = state.myListings.filter(l => l.id !== action.payload);
    },
    setCurrentListing: (state, action: PayloadAction<ServiceListing | null>) => {
      state.currentListing = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setListings,
  setFeaturedListings,
  setTrendingListings,
  setCategories,
  setMyListings,
  addListing,
  updateListing,
  deleteListing,
  setCurrentListing,
  setFilters,
  clearFilters,
  setLoading,
  setError,
} = listingsSlice.actions;

export default listingsSlice.reducer;
