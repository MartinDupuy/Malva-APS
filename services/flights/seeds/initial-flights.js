'use strict';

const Flight = require('../domain/flight');

function getTodayIso() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function getNextYearIso() {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

function createInitialFlights() {
  const startDate = getTodayIso();
  const endDate = getNextYearIso();
  const allDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const flightConfigs = [
    {
      id: 'flight-seed-1',
      flightNumber: 'AR1234',
      originAirport: 'EZE',
      destinationAirport: 'COR',
      departureTime: '08:00',
      arrivalTime: '09:30',
      operatingDays: allDays,
      availabilityPeriod: { startDate, endDate },
      capacity: { economy: 150, firstClass: 12 },
      pricing: { economy: 45000, firstClass: 95000 },
      currency: 'USD',
      status: 'ACTIVE',
    },
    {
      id: 'flight-seed-2',
      flightNumber: 'AR1400',
      originAirport: 'AEP',
      destinationAirport: 'MDZ',
      departureTime: '11:15',
      arrivalTime: '13:05',
      operatingDays: allDays,
      availabilityPeriod: { startDate, endDate },
      capacity: { economy: 140, firstClass: 10 },
      pricing: { economy: 55000, firstClass: 110000 },
      currency: 'USD',
      status: 'ACTIVE',
    },
    {
      id: 'flight-seed-3',
      flightNumber: 'AR1500',
      originAirport: 'EZE',
      destinationAirport: 'BRC',
      departureTime: '14:30',
      arrivalTime: '16:45',
      operatingDays: allDays,
      availabilityPeriod: { startDate, endDate },
      capacity: { economy: 160, firstClass: 16 },
      pricing: { economy: 72000, firstClass: 145000 },
      currency: 'USD',
      status: 'ACTIVE',
    },
    {
      id: 'flight-seed-4',
      flightNumber: 'AR1600',
      originAirport: 'COR',
      destinationAirport: 'EZE',
      departureTime: '18:00',
      arrivalTime: '19:30',
      operatingDays: allDays,
      availabilityPeriod: { startDate, endDate },
      capacity: { economy: 150, firstClass: 12 },
      pricing: { economy: 45000, firstClass: 95000 },
      currency: 'USD',
      status: 'ACTIVE',
    },
  ];

  return flightConfigs.map((config) => new Flight(config));
}

module.exports = { createInitialFlights };
