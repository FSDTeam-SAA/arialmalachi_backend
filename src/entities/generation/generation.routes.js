/**
 * Generation Routes - Poster and Logo Generation endpoints
 */

import express from 'express';
import { verifyToken } from '../../core/middlewares/authMiddleware.js';
import { upload } from '../../core/middlewares/multer.js';
import { generationController } from './generation.controller.js';

const router = express.Router();

// Protect all routes with authentication middleware
router.use(verifyToken);

// ==================== POSTER ROUTES ====================

/**
 * POST /api/generations/poster/initiate
 * Initiate poster generation (returns job_id)
 */
router.post('/poster/initiate', upload.single('image'), generationController.initiatePoster);

/**
 * POST /api/generations/poster/result/:generationId
 * Get poster result and deduct credits
 */
router.post('/poster/result/:generationId', generationController.getPosterResult);

/**
 * GET /api/generations/poster/fields/:jobId
 * Get available poster fields
 */
router.get('/poster/fields/:jobId', generationController.getPosterFields);

/**
 * POST /api/generations/poster/fields/ai-generate
 * AI generate poster fields
 */
router.post('/poster/fields/ai-generate', generationController.aiGeneratePosterFields);

// ==================== LOGO ROUTES ====================

/**
 * POST /api/generations/logo/initiate
 * Initiate logo generation (returns job_id)
 */
router.post('/logo/initiate', upload.single('reference_image'), generationController.initiateLogo);

/**
 * POST /api/generations/logo/result/:generationId
 * Get logo result and deduct credits
 */
router.post('/logo/result/:generationId', generationController.getLogoResult);

// ==================== UTILITY ROUTES ====================

/**
 * GET /api/generations/history
 * Get user's generation history
 */
router.get('/history', generationController.getGenerationHistory);

/**
 * DELETE /api/generations/history/:id
 * Delete a specific generation history item
 */
router.delete('/history/:id', generationController.deleteGenerationHistory);

/**
 * GET /api/generations/credits/balance
 * Get user's current credit balance
 */
router.get('/credits/balance', generationController.getCreditBalance);

/**
 * GET /api/generations/dashboard
 * Get user's dashboard overview analytics
 */
router.get('/dashboard', generationController.getDashboardOverview);

export default router;
