import express from 'express';
import {
  createPlanController,
  getAllPlansController,
  getPlanByIdController,
  updatePlanController,
  deletePlanController,
  subscribeToPlanController,
} from './subscription.controller.js';
import { verifyToken, adminMiddleware } from '../../core/middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllPlansController);
router.get('/:id', getPlanByIdController);

// User routes
router.post('/subscribe/:planId', verifyToken, subscribeToPlanController);

// Admin only routes
router.post('/', verifyToken, adminMiddleware, createPlanController);
router.put('/:id', verifyToken, adminMiddleware, updatePlanController);
router.delete('/:id', verifyToken, adminMiddleware, deletePlanController);

export default router;
