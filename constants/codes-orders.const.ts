const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/** Orders — database layer (16xxx). */
export const ORDERS_DATABASE = {
  READ_FAILED: createErrorDefinition(16600, 'Could not load orders. Try again.'),
  WRITE_FAILED: createErrorDefinition(16601, 'Could not place the order. Try again.'),
} as const;

/** Orders — validation layer (26xxx). */
export const ORDERS_VALIDATION = {
  ORDER_NOT_FOUND: createErrorDefinition(26600, 'Order not found.'),
  PRODUCT_NOT_FOUND: createErrorDefinition(26601, 'One of the products is no longer available.'),
  EMPTY_ORDER: createErrorDefinition(26602, 'An order needs at least one item.'),
} as const;

/** Orders — business layer (36xxx). */
export const ORDERS_BUSINESS = {
  INSUFFICIENT_STOCK: createErrorDefinition(36600, 'There is not enough stock for one of the items.'),
  ILLEGAL_TRANSITION: createErrorDefinition(36601, 'That status change is not allowed for this order.'),
  NOT_BUYER: createErrorDefinition(36602, 'That order is not yours.'),
  NOT_SELLER: createErrorDefinition(36603, 'That order is not assigned to your catalog.'),
  SUPPLIER_MISMATCH: createErrorDefinition(36604, 'An order can contain products from only one supplier.'),
} as const;
