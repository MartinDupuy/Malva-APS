import { useEffect, useRef, useState } from 'react';
import { confirmBooking, createBooking, getSeatAvailability } from '../services/bookingService';

export function useBooking(flight) {
  const [seats, setSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const bookingRef = useRef(null);

  const refreshAvailability = async () => {
    try {
      const availableSeats = await getSeatAvailability(flight.id);
      if (bookingRef.current) return;
      setSeats(availableSeats);
      setSelectedSeatIds(current => {
        const availableIds = new Set(availableSeats.filter(seat => seat.status === 'AVAILABLE').map(seat => seat.id));
        const stillAvailable = current.filter(seatId => availableIds.has(seatId));
        if (stillAvailable.length !== current.length) {
          setError(new Error('Uno de los asientos seleccionados ya fue bloqueado por otro pasajero.'));
        }
        return stillAvailable;
      });
    } catch (requestError) {
      setError(requestError);
    }
  };

  useEffect(() => {
    if (booking) return undefined;
    bookingRef.current = null;
    setIsLoading(true);
    refreshAvailability().finally(() => setIsLoading(false));
    const interval = window.setInterval(refreshAvailability, 5000);
    window.addEventListener('focus', refreshAvailability);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshAvailability);
    };
  }, [flight, booking]);

  const toggleSeat = seatId => {
    const seat = seats.find(currentSeat => currentSeat.id === seatId);
    if (!seat || seat.status !== 'AVAILABLE') {
      setError(new Error('Ese asiento ya no está disponible. Actualizando disponibilidad...'));
      refreshAvailability();
      return;
    }
    setSelectedSeatIds(current => current.includes(seatId)
      ? current.filter(id => id !== seatId)
      : current.length < 9 ? [...current, seatId] : current);
  };

  const reserve = async passengers => {
    setIsLoading(true); setError(null);
    try {
      const result = await createBooking(flight.id, passengers);
      bookingRef.current = result;
      setBooking(result);
      return result;
    }
    catch (requestError) { setError(requestError); await refreshAvailability(); throw requestError; }
    finally { setIsLoading(false); }
  };

  const confirm = async () => { const result = await confirmBooking(booking.id); setBooking(result); return result; };
  return { seats, selectedSeatIds, toggleSeat, booking, reserve, confirm, error, isLoading };
}