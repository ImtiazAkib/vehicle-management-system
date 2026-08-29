export const APP_DATA = {
  NAME: 'Vehicle Utilities Supply and Maintenance System',
  SHORT_NAME: 'VUSMS',
  TAGLINE: 'Keep every vehicle on the road.',
  DESCRIPTION:
    'A vehicle utilities supply and maintenance platform: owners keep their vehicle profiles and service history in one place, automate maintenance schedules with reminders, book work from verified service centers and order supplies from verified suppliers — with role-based dashboards for owners, service centers, suppliers and administrators.',
  LOGO: {
    IMAGE_ALT: 'VUSMS logo',
  },
  /*
    One operator in one country, so the app names its currency rather than carrying a table of them.
    `MINOR_UNIT_DIGITS` is the exponent every money helper works in: money is stored as an integer count
    of minor units, and `2` is what turns 50050 back into ৳500.50. The values here — and the name above —
    are the placeholders a real deployment renames.
  */
  CURRENCY: {
    CODE: 'BDT',
    SYMBOL: '৳',
    MINOR_UNIT_DIGITS: 2,
  },
} as const;
