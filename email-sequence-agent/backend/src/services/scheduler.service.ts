import cron from 'node-cron';
import * as processorService from './processor.service.js';
import config from '../config.js';

let schedulerTask: cron.ScheduledTask | null = null;
let isRunning = false;

// Start scheduler
export function startScheduler(): void {
  if (schedulerTask) {
    console.log('⚠️  Scheduler already running');
    return;
  }

  // Run every N minutes
  const cronExpression = `*/${config.cronIntervalMinutes} * * * *`;

  console.log(`\n⏰ Starting scheduler: every ${config.cronIntervalMinutes} minutes`);
  console.log(`   Cron expression: ${cronExpression}`);
  console.log(`   Timezone: ${config.timezone}`);
  console.log(`   Sending hours: ${config.sendHourStart}:00-${config.sendHourEnd}:00`);
  console.log(`   Weekends: ${config.sendWeekends ? 'Yes' : 'No'}`);
  console.log(`   Dry run: ${config.dryRun ? 'Yes' : 'No'}`);
  if (config.dryRun && config.testEmail) {
    console.log(`   Test email: ${config.testEmail}`);
  }

  schedulerTask = cron.schedule(
    cronExpression,
    async () => {
      if (isRunning) {
        console.log('⏭️  Skipping run - previous run still in progress');
        return;
      }

      isRunning = true;

      try {
        await processorService.processAll();
      } catch (error) {
        console.error('❌ Error in scheduled run:', error);
      } finally {
        isRunning = false;
      }
    },
    {
      scheduled: true,
      timezone: config.timezone,
    }
  );

  console.log('✅ Scheduler started!\n');
}

// Stop scheduler
export function stopScheduler(): void {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    console.log('🛑 Scheduler stopped');
  }
}

// Run immediately (manual trigger)
export async function runNow(): Promise<void> {
  if (isRunning) {
    console.log('⏳ A run is already in progress');
    return;
  }

  console.log('▶️  Manual run triggered');
  isRunning = true;

  try {
    await processorService.processAll();
  } catch (error) {
    console.error('❌ Error in manual run:', error);
  } finally {
    isRunning = false;
  }
}

// Get scheduler status
export function getStatus(): {
  running: boolean;
  isProcessing: boolean;
  cronExpression: string;
  intervalMinutes: number;
  timezone: string;
} {
  return {
    running: schedulerTask !== null,
    isProcessing: isRunning,
    cronExpression: `*/${config.cronIntervalMinutes} * * * *`,
    intervalMinutes: config.cronIntervalMinutes,
    timezone: config.timezone,
  };
}

export default {
  startScheduler,
  stopScheduler,
  runNow,
  getStatus,
};
