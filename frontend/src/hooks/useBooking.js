import { useEffect, useState } from 'react';
import { confirmBooking, createBooking, getSeatAvailability } from '../services/bookingService';

export function useBooking(flight) {
  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getSeatAvailability(flight.id).then(setSeats).catch(setError).finally(() => setIsLoading(false));
  }, [flight]);

  const toggleSeat = seatId => {
    setSelectedSeatIds(current => current.includes(seatId)
      ? current.filter(id => id !== seatId)
      : current.length < 9 ? [...current, seatId] : current);
  };

  const reserve = async passengers => {
    setIsLoading(true); setError(null);
    try { const result = await createBooking(flight.id, passengers); setBooking(result); return result; }
    catch (requestError) { setError(requestError); throw requestError; }
    finally { setIsLoading(false); }
  };

  const confirm = async () => { const result = await confirmBooking(booking.id); setBooking(result); return result; };
  return { seats, selectedSeatIds, toggleSeat, booking, reserve, confirm, error, isLoading };
}