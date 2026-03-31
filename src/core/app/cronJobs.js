import cron from 'node-cron';
import subscriptionService from '../../entities/subscription/subscription.service.js';

export const initPaymentCheckCron = () => {
  // Run every minute to check for pending payments
  cron.schedule('* * * * *', async () => {
    console.log('Running cron job for pending payment verification...');
    try {
      await subscriptionService.verifyPendingPayments();
    } catch (error) {
      console.error('Error in payment check cron job:', error);
    }
  });

  // Run every day at midnight to check for expired subscriptions
  cron.schedule('0 0 * * *', async () => {
    console.log('Running cron job for expired subscription check...');
    try {
      await subscriptionService.checkExpiredSubscriptions();
    } catch (error) {
      console.error('Error in expired subscription check cron job:', error);
    }
  });

  // Run every hour to check for timed blocks that should be released
  cron.schedule('0 * * * *', async () => {
    console.log('Running cron job for auto-unblock check...');
    try {
      const { checkAutoUnblock } = await import('../../entities/user/user.service.js');
      await checkAutoUnblock();
    } catch (error) {
      console.error('Error in auto-unblock cron job:', error);
    }
  });
  
  console.log('Cron jobs initialized: Payment Check (1m), Expiry Check (Daily), Auto-Unblock (1h)');
};
