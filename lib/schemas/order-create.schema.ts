import { z } from 'zod';

/*
  What a buyer submits to place an order. Prices are deliberately absent — the server snapshots each line's
  `unitPrice` from the catalog at order time, so there is nothing here to trust or spoof. One order targets
  exactly one supplier; a basket spanning sellers is two orders.
*/
const optionalText = (max: number) =>
  z.preprocess(value => (value === '' || value == null ? undefined : value), z.string().trim().max(max).optional());

const shippingAddress = z.object({
  line1: z.string().trim().min(1, 'Enter the delivery address.').max(200, 'Address is too long.'),
  line2: optionalText(200),
  city: z.string().trim().min(1, 'Enter the city.').max(120, 'City is too long.'),
  postalCode: optionalText(20),
  phone: optionalText(40),
});

const orderItem = z.object({
  product: z.string().min(1, 'Missing product.'),
  quantity: z.coerce.number().int('Enter a whole number.').min(1, 'Order at least one.'),
});

export const OrderCreateSchema = z.object({
  supplier: z.string().min(1, 'Missing supplier.'),
  items: z.array(orderItem).min(1, 'An order needs at least one item.'),
  shippingAddress,
});

export type OrderCreateOutput = z.output<typeof OrderCreateSchema>;
