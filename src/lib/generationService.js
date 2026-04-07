/**
 * Credit & Generation Management Service
 * Handles credit validation, deduction, and tracking of poster/logo generations
 */

import User from '../entities/auth/auth.model.js';

const CREDITS_PER_VARIANT = 1; // 1 credit per generated variant

class GenerationService {
  
  /**
   * Validate if user has enough credits for generation
   * @param {string} userId - User ID
   * @param {number} creditCost - Credits required (default: 1)
   * @returns {Promise<Object>} - { hasCredits: boolean, currentCredits: number, message: string }
   */
  async validateUserCredits(userId, creditCost = CREDITS_PER_VARIANT) {
    try {
      const user = await User.findById(userId).select('credits isSubscribed expiryDate');
      
      if (!user) {
        return {
          hasCredits: false,
          currentCredits: 0,
          message: 'User not found',
          statusCode: 404,
        };
      }

      // Check if user is subscribed and subscription is active
      if (!user.isSubscribed || (user.expiryDate && new Date() > user.expiryDate)) {
        return {
          hasCredits: false,
          currentCredits: user.credits || 0,
          message: 'No active subscription or subscription has expired',
          statusCode: 403,
        };
      }

      // Check if user has enough credits
      if (!user.credits || user.credits < creditCost) {
        return {
          hasCredits: false,
          currentCredits: user.credits || 0,
          requiredCredits: creditCost,
          message: `Insufficient credits. You have ${user.credits || 0} credits, but need ${creditCost}`,
          statusCode: 402,
        };
      }

      return {
        hasCredits: true,
        currentCredits: user.credits,
        message: 'User has sufficient credits',
      };
    } catch (error) {
      console.error('Error validating user credits:', error);
      throw error;
    }
  }

  /**
   * Deduct credits from user for generation
   * @param {string} userId - User ID
   * @param {number} creditCost - Credits to deduct (default: 1)
   * @returns {Promise<Object>} - Updated user credits
   */
  async deductCredits(userId, creditCost = CREDITS_PER_VARIANT) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: -creditCost } },
        { new: true, runValidators: true }
      ).select('credits');

      if (!user) {
        throw new Error('User not found');
      }

      console.log(`Deducted ${creditCost} credits from user ${userId}. Remaining: ${user.credits}`);
      
      return {
        userId,
        deductedCredits: creditCost,
        remainingCredits: user.credits,
        message: `Successfully deducted ${creditCost} credit(s)`,
      };
    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
  }

  /**
   * Refund credits to user (in case of failed generation)
   * @param {string} userId - User ID
   * @param {number} creditCost - Credits to refund (default: 1)
   * @returns {Promise<Object>} - Updated user credits
   */
  async refundCredits(userId, creditCost = CREDITS_PER_VARIANT) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: creditCost } },
        { new: true, runValidators: true }
      ).select('credits');

      if (!user) {
        throw new Error('User not found');
      }

      console.log(`Refunded ${creditCost} credits to user ${userId}. Total: ${user.credits}`);
      
      return {
        userId,
        refundedCredits: creditCost,
        totalCredits: user.credits,
        message: `Successfully refunded ${creditCost} credit(s)`,
      };
    } catch (error) {
      console.error('Error refunding credits:', error);
      throw error;
    }
  }

  /**
   * Get user's current credit balance
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Current credit balance
   */
  async getUserCredits(userId) {
    try {
      const user = await User.findById(userId).select('credits');
      return user?.credits || 0;
    } catch (error) {
      console.error('Error fetching user credits:', error);
      throw error;
    }
  }

  /**
   * Check if user is subscription free (no credits)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if user has no credits
   */
  async isCreditsEmpty(userId) {
    try {
      const credits = await this.getUserCredits(userId);
      return credits <= 0;
    } catch (error) {
      console.error('Error checking if credits are empty:', error);
      throw error;
    }
  }
}

export default new GenerationService();
