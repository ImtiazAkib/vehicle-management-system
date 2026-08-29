/**
 * The five roles a person can hold. Stored as these exact strings on `User.role`, and the single
 * source every guard, label and route map narrows against.
 *
 * `super-admin` is the seeded platform owner; `admin` governs the perimeter; `owner`, `service-center`
 * and `supplier` are the three business roles that self-register.
 */
export type UserRole = 'super-admin' | 'admin' | 'owner' | 'service-center' | 'supplier';
