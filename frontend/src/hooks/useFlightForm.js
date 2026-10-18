import { useState } from 'react';

const EMPTY_FLIGHT = {
  flightNumber: '', originAirport: '', destinationAirport: '', departureTime: '08:30', arrivalTime: '10:15',
  operatingDays: ['MON', 'WED', 'FRI'], availabilityPeriod: { startDate: '', endDate: '' },
  capacity: { economy: '', firstClass: '' }, pricing: { economy: '', firstClass: '' },
};

function normalizeFlight(flight) {
  return {
    ...flight,
    availabilityPeriod: { ...flight.availabilityPeriod, startDate: flight.availabilityPeriod.startDate.slice(0, 10), endDate: flight.availabilityPeriod.endDate.slice(0, 10) },
    capacity: { economy: flight.capacity.economy, firstClass: flight.capacity.firstClass },
    pricing: { economy: flight.pricing.economy, firstClass: flight.pricing.firstClass },
  };
}

export function useFlightForm() {
  const [form, setForm] = useState(EMPTY_FLIGHT);
  const [editingId, setEditingId] = useState(null);

  const editFlight = flight => { setForm(normalizeFlight(flight)); setEditingId(flight.id); };
  const resetForm = () => { setForm(EMPTY_FLIGHT); setEditingId(null); };
  const updateField = (path, value) => {
    const [group, field] = path.split('.');
    setForm(current => field ? { ...current, [group]: { ...current[group], [field]: value } } : { ...current, [group]: value });
  };
  const toggleDay = day => setForm(current => ({ ...current, operatingDays: current.operatingDays.includes(day) ? current.operatingDays.filter(item => item !== day) : [...current.operatingDays, day] }));

  return { form, editingId, editFlight, resetForm, updateField, toggleDay };
}
