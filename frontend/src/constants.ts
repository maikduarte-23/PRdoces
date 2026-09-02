/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const PRICING = {
  PRODUCTS: {
    mini_trufa_tradicional: {
      label: 'Mini Trufas Tradicionais',
      price: 1.40, // 140/100
      minQty: 50,
      isByHundred: true
    },
    mini_trufa_frutas: {
      label: 'Mini Trufas Frutas',
      price: 1.60, // 160/100
      minQty: 50,
      isByHundred: true
    },
    brigadeiro_classico: {
      label: 'Brigadeiros Clássicos',
      price: 1.10, // 110/100
      minQty: 50,
      isByHundred: true
    },
    bombom_fruta: {
      label: 'Bombons de Fruta',
      price: 2.50,
      minQty: 20,
      isByHundred: false
    },
    trufa_decorada: {
      label: 'Trufas Decoradas',
      price: 2.00, // Range 2-5, starting at 2
      minQty: 20,
      isByHundred: false
    },
    pirulito_decorado: {
      label: 'Pirulitos Decorados',
      price: 7.00,
      minQty: 10,
      isByHundred: false
    },
    cupcake: {
      label: 'Cupcakes',
      price: 4.00,
      minQty: 15,
      isByHundred: false
    }
  },
  DECORATION: {
    MIN: 2,
    MAX: 5,
  },
  FLOWER_WRAPPERS: {
    MIN: 20,
    MAX: 30,
  }
};

export const DELIVERY_RESIDENTIAL = "Residencial Viver Maracacuera 2";

export const WORKING_HOURS = {
  WEEKDAY: { start: '09:00', end: '18:00' },
  SATURDAY: { start: '09:00', end: '16:00' }
};

export const PRODUCTION_DAILY_LIMIT_DEFAULT = 5; // Encomendas por dia

export const DIETARY_WARNING = "Aviso: Nossos produtos contêm lactose e podem conter glúten/amendoim.";
