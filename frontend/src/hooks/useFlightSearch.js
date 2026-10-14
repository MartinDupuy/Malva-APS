import { useState } from 'react';
import { searchAvailableFlights } from '../services/passengerSearchService';

export function useFlightSearch() {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async criteria => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      setResults(await searchAvailableFlights(criteria));
    } catch (searchError) {
      setResults([]);
      setError(searchError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { results, isLoading, error, hasSearched, performSearch };
}
