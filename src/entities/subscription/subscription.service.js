import Stripe from 'stripe';
import SubscriptionPlan from './subscription.model.js';
import SubscriptionTransaction from './subscriptionTransaction.model.js';
import User from '../auth/auth.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

class SubscriptionService {
  async createPlan(planData) {
    return await SubscriptionPlan.create(planData);
  }

  async getAllPlans() {
    return await SubscriptionPlan.find().sort({ monthlyPrice: 1 });
  }

  async getPlanById(id) {
    return await SubscriptionPlan.findById(id);
  }

  async updatePlan(id, updateData) {
    return await SubscriptionPlan.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async deletePlan(id) {
    return await SubscriptionPlan.findByIdAndDelete(id);
  }

  async createCheckoutSession(userId, planId) {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) throw new Error('Subscription plan not found');

    if (plan.monthlyPrice === 0) {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Directly update user for free plan
      user.planId = plan._id;
      user.isSubscribed = true;
      user.hasActiveSubscription = true;
      user.credits = (user.credits || 0) + plan.credits;
      user.subscribedDate = new Date();
      
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      user.expiryDate = expiryDate;
      user.subscriptionExpireDate = expiryDate;

      await user.save();

      // Create a completed transaction record
      await SubscriptionTransaction.create({
        userId,
        planId,
        sessionId: `free_plan_${Date.now()}`,
        amount: 0,
        status: 'completed',
      });

      return { type: 'free', message: 'Free plan activated successfully' };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: Math.round(plan.monthlyPrice * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      metadata: {
        userId: userId.toString(),
        planId: planId.toString(),
      },
    });

    await SubscriptionTransaction.create({
      userId,
      planId,
      sessionId: session.id,
      amount: plan.monthlyPrice,
      status: 'pending',
    });

    return { type: 'stripe', url: session.url };
  }

  async verifyPendingPayments() {
    const pendingTransactions = await SubscriptionTransaction.find({ status: 'pending' });

    for (const transaction of pendingTransactions) {
      try {
        const session = await stripe.checkout.sessions.retrieve(transaction.sessionId);

        if (session.payment_status === 'paid') {
          const plan = await SubscriptionPlan.findById(transaction.planId);
          const user = await User.findById(transaction.userId);

          if (plan && user) {
            user.planId = plan._id;
            user.isSubscribed = true;
            user.hasActiveSubscription = true;
            user.credits = (user.credits || 0) + plan.credits;
            user.subscribedDate = new Date();
            
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);
            user.expiryDate = expiryDate;
            user.subscriptionExpireDate = expiryDate;

            await user.save();
            transaction.status = 'completed';
            await transaction.save();
            console.log(`Successfully verified and updated subscription for user ${user._id}`);
          }
        } else if (session.status === 'expired') {
          transaction.status = 'failed';
          await transaction.save();
        }
      } catch (error) {
        console.error(`Error verifying transaction ${transaction.sessionId}:`, error);
      }
    }
  }

  async checkExpiredSubscriptions() {
    const now = new Date();
    // Find users with active subscriptions that have passed their expiry date
    const expiredUsers = await User.find({
      isSubscribed: true,
      expiryDate: { $lt: now },
    });

    for (const user of expiredUsers) {
      try {
        user.isSubscribed = false;
        user.hasActiveSubscription = false;
        user.planId = null;
        // Optionally keep credits or reset them based on business logic
        // user.credits = 0; 
        
        await user.save();
        console.log(`Deactivated expired subscription for user: ${user.email}`);
      } catch (error) {
        console.error(`Error deactivating subscription for user ${user.email}:`, error);
      }
    }
  }
}

export default new SubscriptionService();
