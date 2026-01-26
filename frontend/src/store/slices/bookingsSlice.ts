import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingStatus } from '@/models/types';

interface BookingsState {
  bookings: Booking[];
  myBookings: Booking[]; // For seekers
  receivedBookings: Booking[]; // For providers
  currentBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingsState = {
  bookings: [],
  myBookings: [],
  receivedBookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
    },
    setMyBookings: (state, action: PayloadAction<Booking[]>) => {
      state.myBookings = action.payload;
    },
    setReceivedBookings: (state, action: PayloadAction<Booking[]>) => {
      state.receivedBookings = action.payload;
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings.unshift(action.payload);
      if (action.payload.seekerId) {
        state.myBookings.unshift(action.payload);
      }
      if (action.payload.providerId) {
        state.receivedBookings.unshift(action.payload);
      }
    },
    updateBookingStatus: (state, action: PayloadAction<{ id: string; status: BookingStatus }>) => {
      const { id, status } = action.payload;
      const booking = state.bookings.find(b => b.id === id);
      if (booking) {
        booking.status = status;
        booking.updatedAt = new Date().toISOString();
      }
      const myBooking = state.myBookings.find(b => b.id === id);
      if (myBooking) {
        myBooking.status = status;
        myBooking.updatedAt = new Date().toISOString();
      }
      const receivedBooking = state.receivedBookings.find(b => b.id === id);
      if (receivedBooking) {
        receivedBooking.status = status;
        receivedBooking.updatedAt = new Date().toISOString();
      }
    },
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
    },
    cancelBooking: (state, action: PayloadAction<string>) => {
      const booking = state.bookings.find(b => b.id === action.payload);
      if (booking) {
        booking.status = 'cancelled';
        booking.updatedAt = new Date().toISOString();
      }
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
  setBookings,
  setMyBookings,
  setReceivedBookings,
  addBooking,
  updateBookingStatus,
  setCurrentBooking,
  cancelBooking,
  setLoading,
  setError,
} = bookingsSlice.actions;

export default bookingsSlice.reducer;
