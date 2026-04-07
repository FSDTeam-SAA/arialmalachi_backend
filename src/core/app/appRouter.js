import express from 'express';
import authRoutes from '../../entities/auth/auth.routes.js';
import userRoutes from '../../entities/user/user.routes.js';
import subscriptionRoutes from '../../entities/subscription/subscription.routes.js';
import generationRoutes from '../../entities/generation/generation.routes.js';

const router = express.Router();

router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);

router.use('/v1/subscription', subscriptionRoutes);
router.use('/v1/generations', generationRoutes);

export default router;
