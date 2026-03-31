import { generateResponse } from "../../lib/responseFormate.js";
import subscriptionService from "./subscription.service.js";

export const createPlanController = async (req, res) => {
  try {
    const plan = await subscriptionService.createPlan(req.body);
    generateResponse(res, 201, true, "Subscription plan created successfully", plan);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to create subscription plan", error.message);
  }
};

export const getAllPlansController = async (req, res) => {
  try {
    const plans = await subscriptionService.getAllPlans();
    generateResponse(res, 200, true, "Subscription plans fetched successfully", plans);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch subscription plans", error.message);
  }
};

export const getPlanByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionService.getPlanById(id);
    if (!plan) {
      return generateResponse(res, 404, false, "Subscription plan not found");
    }
    generateResponse(res, 200, true, "Subscription plan fetched successfully", plan);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch subscription plan", error.message);
  }
};

export const updatePlanController = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionService.updatePlan(id, req.body);
    if (!plan) {
      return generateResponse(res, 404, false, "Subscription plan not found");
    }
    generateResponse(res, 200, true, "Subscription plan updated successfully", plan);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to update subscription plan", error.message);
  }
};

export const deletePlanController = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await subscriptionService.deletePlan(id);
    if (!plan) {
      return generateResponse(res, 404, false, "Subscription plan not found");
    }
    generateResponse(res, 200, true, "Subscription plan deleted successfully", null);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to delete subscription plan", error.message);
  }
};

export const subscribeToPlanController = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user._id;
    const result = await subscriptionService.createCheckoutSession(userId, planId);
    
    if (result.type === 'free') {
      return generateResponse(res, 200, true, result.message, null);
    }

    generateResponse(res, 200, true, "Checkout session created successfully", { sessionUrl: result.url });
  } catch (error) {
    generateResponse(res, 500, false, "Failed to create checkout session", error.message);
  }
};
