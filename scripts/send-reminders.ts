import mongoose from 'mongoose';

import { createLoggerWithContext } from '@/lib/logger';
import { MaintenanceService } from '@/lib/services';

const log = createLoggerWithContext('send-reminders');

/*
  The maintenance-reminder sweep. PM2 runs this on a `cron_restart` schedule (see `ecosystem.config.js`)
  rather than an in-process timer, because a restart-prone web instance is not guaranteed to be alive at
  the minute a schedule comes due — the schedule is the clock, not the app. Running it twice is safe:
  `lastNotifiedAt` dedupes an overlapping or repeated run.
*/
async function run(): Promise<void> {
  const service = new MaintenanceService();

  const summary = await service.runReminderSweep();

  log.info(summary, 'Maintenance reminder sweep complete');

  await mongoose.disconnect();
}

run().catch(async error => {
  log.error({ err: error }, 'Reminder sweep failed');
  await mongoose.disconnect();
  process.exitCode = 1;
});
