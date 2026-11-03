const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createRequire } = require('module');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

const frontendRoot = path.resolve(__dirname, '../frontend/src');

function loadJsx(relativePath, mocks = {}) {
  const filename = path.join(frontendRoot, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const { code } = transformSync(source, {
    loader: 'jsx',
    format: 'cjs',
    jsx: 'automatic',
    sourcefile: filename
  });
  const compiledModule = { exports: {} };
  const requireFromComponent = createRequire(filename);
  const componentRequire = specifier => Object.hasOwn(mocks, specifier)
    ? mocks[specifier]
    : requireFromComponent(specifier);

  vm.runInNewContext(code, {
    module: compiledModule,
    exports: compiledModule.exports,
    require: componentRequire
  }, { filename });
  return compiledModule.exports;
}

describe('Flight web components', () => {
  test('validates passenger count and rejects identical airports', () => {
    const { validateSearchCriteria } = loadJsx('components/passenger/SearchForm.jsx');

    expect(validateSearchCriteria({ origin: 'EZE', destination: 'COR', passengers: '2' })).toBe('');
    expect(validateSearchCriteria({ origin: 'EZE', destination: 'COR', passengers: '0' }))
      .toBe('Ingresá entre 1 y 9 pasajeros.');
    expect(validateSearchCriteria({ origin: 'EZE', destination: 'COR', passengers: '10' }))
      .toBe('Ingresá entre 1 y 9 pasajeros.');
    expect(validateSearchCriteria({ origin: 'EZE', destination: 'EZE', passengers: '1' }))
      .toBe('El origen y el destino deben ser distintos.');
  });

  test('renders the search fields and supported passenger limits', () => {
    const { SearchForm } = loadJsx('components/passenger/SearchForm.jsx');
    const html = renderToStaticMarkup(React.createElement(SearchForm, { onSearch: jest.fn() }));

    expect(html).toContain('Desde');
    expect(html).toContain('Hasta');
    expect(html).toContain('Fecha');
    expect(html).toContain('Pasajeros');
    expect(html).toContain('min="1" max="9"');
    expect(html).toContain('Tarifa máxima');
    expect(html).toContain('Primera clase');
  });

  test('renders flight route, schedule, fares and seat availability by class', () => {
    const { FlightCard } = loadJsx('components/passenger/FlightCard.jsx', {
      './SeatSelection': { SeatSelection: () => null }
    });
    const flight = {
      id: 'flight-1',
      flightNumber: 'AR1234',
      originAirport: 'EZE',
      destinationAirport: 'COR',
      departureTime: '10:00',
      arrivalTime: '11:30',
      capacity: { economy: 10, firstClass: 3 },
      availableSeats: { economy: 1, firstClass: 3 },
      pricing: { economy: 50000, firstClass: 120000 }
    };
    const html = renderToStaticMarkup(React.createElement(FlightCard, {
      flight,
      criteria: { passengers: 2, cabinClass: 'all', tariff: '', date: '2099-01-05' }
    }));

    expect(html).toContain('AR1234');
    expect(html).toContain('EZE');
    expect(html).toContain('COR');
    expect(html).toContain('10:00');
    expect(html).toContain('11:30');
    expect(html).toContain('Sin cupo suficiente');
    expect(html).toContain('3 asientos disponibles');
    expect(html).toContain('Economy');
    expect(html).toContain('Primera clase');
  });

  test('renders the admin create/edit form with schedule, operating days and class capacity', () => {
    const { FlightForm } = loadJsx('components/flights/FlightForm.jsx');
    const form = {
      flightNumber: 'AR1234', originAirport: 'EZE', destinationAirport: 'COR',
      departureTime: '10:00', arrivalTime: '11:30', operatingDays: ['MON', 'WED'],
      availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-12-31' },
      capacity: { economy: 100, firstClass: 10 },
      pricing: { economy: 50000, firstClass: 100000 }
    };
    const props = {
      form, editingId: null, saving: false,
      onChange: jest.fn(), onToggleDay: jest.fn(), onSubmit: jest.fn(), onReset: jest.fn()
    };
    const createHtml = renderToStaticMarkup(React.createElement(FlightForm, props));
    const editHtml = renderToStaticMarkup(React.createElement(FlightForm, { ...props, editingId: 'flight-1' }));

    expect(createHtml).toContain('Crear itinerario');
    expect(createHtml).toContain('Número de vuelo');
    expect(createHtml).toContain('Salida');
    expect(createHtml).toContain('Llegada');
    expect(createHtml).toContain('Días de operación');
    expect(createHtml).toContain('Capacidad y tarifas');
    expect(createHtml).toContain('Economy · asientos');
    expect(createHtml).toContain('Primera · asientos');
    expect(editHtml).toContain('Actualizar itinerario');
    expect(editHtml).toContain('Cancelar edición');
  });

  test('renders flight table actions and hides cancellation for cancelled flights', () => {
    const { FlightTable } = loadJsx('components/flights/FlightTable.jsx', {
      '../ui/StatusPill': { StatusPill: ({ status }) => React.createElement('span', null, status) }
    });
    const activeFlight = {
      id: 'active-flight-1', flightNumber: 'AR1234', originAirport: 'EZE', destinationAirport: 'COR',
      departureTime: '10:00', arrivalTime: '11:30', operatingDays: ['MON', 'WED'],
      availabilityPeriod: { startDate: '2099-01-01', endDate: '2099-12-31' }, status: 'ACTIVE'
    };
    const cancelledFlight = { ...activeFlight, id: 'cancelled-flight-2', flightNumber: 'AR5678', status: 'CANCELLED' };
    const html = renderToStaticMarkup(React.createElement(FlightTable, {
      flights: [activeFlight, cancelledFlight], loading: false, onEdit: jest.fn(), onCancel: jest.fn()
    }));

    expect(html).toContain('AR1234');
    expect(html).toContain('EZE');
    expect(html).toContain('COR');
    expect(html).toContain('MON · WED');
    expect((html.match(/title="Editar itinerario"/g) || []).length).toBe(2);
    expect((html.match(/title="Cancelar itinerario"/g) || []).length).toBe(1);
  });
});
