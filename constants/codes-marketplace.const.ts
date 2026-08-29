const createErrorDefinition = (code: number, message: string) => ({ CODE: code, MESSAGE: message }) as const;

/** Marketplace — database layer (15xxx). */
export const MARKETPLACE_DATABASE = {
  READ_FAILED: createErrorDefinition(15500, 'Could not load products. Try again.'),
  WRITE_FAILED: createErrorDefinition(15501, 'Could not save the product. Try again.'),
} as const;

/** Marketplace — validation layer (25xxx). */
export const MARKETPLACE_VALIDATION = {
  PRODUCT_NOT_FOUND: createErrorDefinition(25500, 'Product not found.'),
  PROFILE_NOT_FOUND: createErrorDefinition(25501, 'Supplier profile not found.'),
} as const;

/** Marketplace — business layer (35xxx). */
export const MARKETPLACE_BUSINESS = {
  DUPLICATE_SKU: createErrorDefinition(35500, 'A product with this SKU already exists.'),
  NOT_OWNER: createErrorDefinition(35501, 'That product does not belong to your catalog.'),
} as const;
