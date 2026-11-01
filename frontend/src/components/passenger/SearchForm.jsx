import { useState } from 'react';

const INITIAL_CRITERIA = {
  origin: '', destination: '', date: '', passengers: '', tariff: '', cabinClass: ''
};

export function SearchForm({ onSearch }) {
  const [criteria, setCriteria] = useState(INITIAL_CRITERIA);
  const [validationError, setValidationError] = useState('');

  const updateField = (field, value) => {
    setCriteria(current => ({ ...current, [field]: value }));
  };

  const submit = event => {
    event.preventDefault();
    const searchCriteria = { ...criteria };
    const passengers = Number(searchCriteria.passengers);
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 9) {
      setValidationError('Ingresá entre 1 y 9 pasajeros.');
      return;
    }
    if (searchCriteria.origin.trim() === searchCriteria.destination.trim()) {
      setValidationError('El origen y el destino deben ser distintos.');
      return;
    }
    setValidationError('');
    searchCriteria.passengers = passengers;
    if (!searchCriteria.cabinClass) delete searchCriteria.cabinClass;
    if (!searchCriteria.tariff) delete searchCriteria.tariff;
    onSearch(searchCriteria);
  };

  const today = new Date();
  const minimumDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return <form className="passenger-search-form expanded-search-form" onSubmit={submit}>
    <div className="search-field"><label htmlFor="origin">Desde</label><input id="origin" value={criteria.origin} onChange={event => updateField('origin', event.target.value.toUpperCase())} placeholder="EZE" maxLength="3" pattern="[A-Za-z]{3}" title="Ingresá un código de aeropuerto de 3 letras." required /></div>
    <span className="swap-mark" aria-hidden="true">⇄</span>
    <div className="search-field"><label htmlFor="destination">Hasta</label><input id="destination" value={criteria.destination} onChange={event => updateField('destination', event.target.value.toUpperCase())} placeholder="COR" maxLength="3" pattern="[A-Za-z]{3}" title="Ingresá un código de aeropuerto de 3 letras." required /></div>
    <div className="search-field"><label htmlFor="search-date">Fecha</label><input id="search-date" type="date" min={minimumDate} value={criteria.date} onChange={event => updateField('date', event.target.value)} required /></div>
    <div className="search-field compact"><label htmlFor="passengers">Pasajeros</label><input id="passengers" type="number" min="1" max="9" step="1" value={criteria.passengers} onChange={event => updateField('passengers', event.target.value)} required /></div>
    <div className="search-field"><label htmlFor="cabin-class">Clase</label><select id="cabin-class" value={criteria.cabinClass} onChange={event => updateField('cabinClass', event.target.value)}><option value="all">Cualquier clase</option><option value="economy">Economy</option><option value="firstClass">Primera clase</option></select></div>
    <div className="search-field"><label htmlFor="max-fare">Tarifa máxima</label><input id="max-fare" type="number" min="0" step="0.01" value={criteria.tariff} onChange={event => updateField('tariff', event.target.value)} placeholder="Sin límite" /></div>
    <button className="search-button" type="submit">Buscar vuelos <span>→</span></button>
    {validationError && <span className="search-validation-error" role="alert">{validationError}</span>}
  </form>;
}
