import cron from 'node-cron';
import * as processorService from './processor-multi.service.js';
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
export async function runNow(): Promise<{
  researchProcessed: number;
  sequencesGenerated: number;
  emailsSent: number;
  repliesFound: number;
  errors: string[];
}> {
  if (isRunning) {
    console.log('⏳ A run is already in progress');
    return {
      researchProcessed: 0,
      sequencesGenerated: 0,
      emailsSent: 0,
      repliesFound: 0,
      errors: ['Process already running'],
    };
  }

  console.log('▶️  Manual run triggered');
  isRunning = true;

  try {
    const results = await processorService.processAll();
    return results;
  } catch (error: any) {
    console.error('❌ Error in manual run:', error);
    return {
      researchProcessed: 0,
      sequencesGenerated: 0,
      emailsSent: 0,
      repliesFound: 0,
      errors: [error.message || 'Unknown error'],
    };
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
