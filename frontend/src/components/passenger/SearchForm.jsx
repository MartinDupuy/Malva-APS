import { useState } from 'react';

const INITIAL_CRITERIA = {
  origin: '', destination: '', date: '', passengers: '', tariff: '', cabinClass: ''
};

export function SearchForm({ onSearch }) {
  const [criteria, setCriteria] = useState(INITIAL_CRITERIA);

  const updateField = (field, value) => {
    setCriteria(current => ({ ...current, [field]: value }));
  };

  const submit = event => {
    event.preventDefault();
    const searchCriteria = { ...criteria };
    if (searchCriteria.passengers) searchCriteria.passengers = Number(searchCriteria.passengers);
    else delete searchCriteria.passengers;
    if (!searchCriteria.cabinClass) delete searchCriteria.cabinClass;
    if (!searchCriteria.tariff) delete searchCriteria.tariff;
    onSearch(searchCriteria);
  };

  return <form className="passenger-search-form expanded-search-form" onSubmit={submit}>
    <div className="search-field"><label htmlFor="origin">Desde</label><input id="origin" value={criteria.origin} onChange={event => updateField('origin', event.target.value.toUpperCase())} placeholder="EZE" maxLength="3" /></div>
    <span className="swap-mark" aria-hidden="true">⇄</span>
    <div className="search-field"><label htmlFor="destination">Hasta</label><input id="destination" value={criteria.destination} onChange={event => updateField('destination', event.target.value.toUpperCase())} placeholder="COR" maxLength="3" /></div>
    <div className="search-field"><label htmlFor="search-date">Fecha</label><input id="search-date" type="date" value={criteria.date} onChange={event => updateField('date', event.target.value)} /></div>
    <div className="search-field compact"><label htmlFor="passengers">Pasajeros</label><input id="passengers" type="number" min="1" max="9" value={criteria.passengers} onChange={event => updateField('passengers', event.target.value)} /></div>
    <div className="search-field"><label htmlFor="cabin-class">Clase</label><select id="cabin-class" value={criteria.cabinClass} onChange={event => updateField('cabinClass', event.target.value)}><option value="all">Cualquier clase</option><option value="economy">Economy</option><option value="firstClass">Primera clase</option></select></div>
    <div className="search-field"><label htmlFor="max-fare">Tarifa máxima</label><input id="max-fare" type="number" min="0" step="0.01" value={criteria.tariff} onChange={event => updateField('tariff', event.target.value)} placeholder="Sin límite" /></div>
    <button className="search-button" type="submit">Buscar vuelos <span>→</span></button>
  </form>;
}
