import { useState, useEffect } from 'react';
import { bookingService } from '../services/booking.service';

export const useBookings = (params = {}) => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    const result = await bookingService.getMyBookings(params);
    
    if (result.success) {
      setBookings(result.bookings);
      setPagination(result.pagination);
      setError(null);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [JSON.stringify(params)]);

  return { bookings, pagination, loading, error, refetch: fetchBookings };
};

export const useBookingDetails = (bookingId) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBooking = async () => {
    if (!bookingId) return;

    setLoading(true);
    const result = await bookingService.getBookingById(bookingId);
    
    if (result.success) {
      setBooking(result.booking);
      setError(null);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  return { booking, loading, error, refetch: fetchBooking };
};
