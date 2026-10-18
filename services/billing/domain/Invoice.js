'use strict';

const crypto = require('crypto');
const Money = require('../../payments/domain/Money');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class Invoice {
  /**
   * @param {Object} data
   * @param {string} [data.invoiceId]
   * @param {string} data.bookingId
   * @param {string} data.customerName
   * @param {string} data.customerEmail
   * @param {Array<{ description: string, quantity: number, unitPrice: number|Money }>} data.items
   * @param {Money|number} data.totalAmount
   * @param {string} [data.currency]
   * @param {Date|string} [data.issuedAt]
   */
  constructor(dataOrInvoiceId = {}, ...rest) {
    let data;
    if (typeof dataOrInvoiceId === 'object' && dataOrInvoiceId !== null && !(dataOrInvoiceId instanceof Date)) {
      data = { ...dataOrInvoiceId };
    } else {
      data = {
        invoiceId: dataOrInvoiceId,
        bookingId: rest[0],
        customerName: rest[1],
        customerEmail: rest[2],
        items: rest[3],
        totalAmount: rest[4],
        currency: rest[5],
        issuedAt: rest[6],
      };
    }

    if (!data.bookingId || (typeof data.bookingId === 'string' && data.bookingId.trim() === '')) {
      throw new Error('bookingId is required');
    }

    if (!data.customerName || (typeof data.customerName === 'string' && data.customerName.trim() === '')) {
      throw new Error('customerName is required');
    }

    if (!data.customerEmail || typeof data.customerEmail !== 'string' || !EMAIL_REGEX.test(data.customerEmail.trim())) {
      throw new Error('customerEmail must be a valid email address');
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('items must be a non-empty array');
    }

    // Determine currency & totalAmount (Value Object Money)
    if (data.totalAmount instanceof Money) {
      this.totalAmount = data.totalAmount;
      this.currency = data.currency || data.totalAmount.currency;
      if (data.currency && data.currency !== data.totalAmount.currency) {
        throw new Error('Currency mismatch between totalAmount and currency');
      }
    } else if (typeof data.totalAmount === 'number') {
      this.currency = data.currency || 'USD';
      this.totalAmount = new Money(data.totalAmount, this.currency);
    } else {
      throw new Error('totalAmount is required and must be a Money instance or integer');
    }

    // Validate items and check consistency with totalAmount
    let calculatedTotal = 0;
    const frozenItems = [];

    for (const item of data.items) {
      if (!item || typeof item !== 'object') {
        throw new Error('Each item must be an object');
      }

      if (!item.description || (typeof item.description === 'string' && item.description.trim() === '')) {
        throw new Error('Item description is required');
      }

      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error('Item quantity must be a positive integer');
      }

      let unitPriceAmount;
      if (item.unitPrice instanceof Money) {
        if (item.unitPrice.currency !== this.currency) {
          throw new Error('Item currency must match invoice currency');
        }
        unitPriceAmount = item.unitPrice.amount;
      } else if (typeof item.unitPrice === 'number' && Number.isInteger(item.unitPrice) && item.unitPrice >= 0) {
        unitPriceAmount = item.unitPrice;
      } else {
        throw new Error('Item unitPrice must be a Money instance or non-negative integer representing cents');
      }

      calculatedTotal += unitPriceAmount * item.quantity;

      frozenItems.push(
        Object.freeze({
          description: typeof item.description === 'string' ? item.description.trim() : item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice instanceof Money ? item.unitPrice : new Money(unitPriceAmount, this.currency),
        })
      );
    }

    if (calculatedTotal !== this.totalAmount.amount) {
      throw new Error(`totalAmount (${this.totalAmount.amount}) does not match sum of items (${calculatedTotal})`);
    }

    this.invoiceId = data.invoiceId || crypto.randomUUID();
    this.bookingId = data.bookingId;
    this.customerName = data.customerName;
    this.customerEmail = data.customerEmail.trim();
    this.items = Object.freeze(frozenItems);
    this.issuedAt = data.issuedAt
      ? (data.issuedAt instanceof Date ? data.issuedAt : new Date(data.issuedAt))
      : new Date();

    Object.freeze(this);
  }
}

module.exports = Invoice;
