import { useCallback, useEffect, useState } from 'react';
import { flightService } from '../services/flightService';

export function useFlights() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFlights = useCallback(async () => {
    setLoading(true);
    try {
      setFlights(await flightService.list());
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFlights(); }, [loadFlights]);

  const saveFlight = async (flight, id) => {
    const savedFlight = id
      ? await flightService.update(id, flight)
      : await flightService.create(flight);
    await loadFlights();
    return savedFlight;
  };

  const cancelFlight = async id => {
    await flightService.cancel(id);
    await loadFlights();
  };

  return { flights, loading, error, saveFlight, cancelFlight, reload: loadFlights };
}
