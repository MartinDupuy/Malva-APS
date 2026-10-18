const CABIN_CLASSES = Object.freeze({
  ECONOMY: 'economy',
  FIRST_CLASS: 'firstClass'
});

function normalizeCabinClass(value) {
  if (!Object.values(CABIN_CLASSES).includes(value)) {
    throw new Error('cabinClass must be economy or firstClass');
  }

  return value;
}

module.exports = { CABIN_CLASSES, normalizeCabinClass };