/**
 * Generation Controller - Handles poster and logo generation endpoints
 */

import generationWorkflowService from './generation.service.js';
import generationService from '../../lib/generationService.js';
import catchAsync from '../../utility/catchAsync.js';
import sendResponse from '../../utility/sendResponse.js';
import { AppError } from '../../utility/AppError.js';

/**
 * POST /api/generations/poster/initiate
 * Initiate poster generation
 * 
 * Required body:
 * {
 *   "title": "string",              // Required
 *   "subtitle": "string",
 *   "description": "string",
 *   "brand_name": "string",
 *   "primary_color": "string",      // Hex color
 *   "secondary_color": "string",    // Hex color
 *   "cta": "string",                // Call to action
 *   "design_style_prompt": "string",
 *   "style_preset": "string",
 *   "output_format": "string",
 *   "language": "string",
 *   "variations": number,
 *   "image": "string"               // Image URL
 * }
 */
const initiatePoster = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const posterData = { ...req.body };

  // If a file was uploaded, attach it to the data
  if (req.file) {
    // We pass the file information to the service
    // ExternalApiService will handle reading it
    posterData.image = req.file;
  }

  // Validate required fields
  if (!posterData?.title) {
    throw new AppError('Poster title is required in request body', 400);
  }

  const result = await generationWorkflowService.initiatePosterGeneration(userId, posterData);

  if (!result?.success) {
    throw new AppError(result?.message, result?.statusCode || 400);
  }

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: result.message,
    data: result,
  });
});

/**
 * POST /api/generations/poster/result/:generationId/:jobId
 * Get poster result and deduct credits
 */
const getPosterResult = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { generationId } = req.params;

  if (!generationId) {
    throw new AppError('Generation ID is required', 400);
  }

  const result = await generationWorkflowService.getPosterResult(userId, generationId);

  if (!result.success) {
    throw new AppError(result.message, result.statusCode || 400);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

/**
 * GET /api/generations/poster/fields/:jobId
 * Get poster fields
 */
const getPosterFields = catchAsync(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    throw new AppError('Job ID is required', 400);
  }

  const result = await generationWorkflowService.getPosterFields(jobId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Poster fields retrieved successfully',
    data: result,
  });
});

/**
 * POST /api/generations/poster/fields/ai-generate
 * AI generate poster fields
 */
const aiGeneratePosterFields = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    throw new AppError('Field generation data is required', 400);
  }

  const result = await generationWorkflowService.aiGeneratePosterFields(userId, data);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'AI fields generated successfully',
    data: result,
  });
});

/**
 * POST /api/generations/logo/initiate
 * Initiate logo generation
 * 
 * Required body:
 * {
 *   "brand_name": "string",         // Required
 *   "tagline": "string",
 *   "vision": "string",
 *   "industry": "string",
 *   "logo_style": "string",
 *   "color_palette": "string",      // Comma-separated hex values
 *   "language": "string",
 *   "reference_image": "string"     // Image URL or base64
 * }
 */
const initiateLogo = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const logoData = { ...req.body };

  // If a reference image was uploaded, attach it
  if (req.file) {
    logoData.reference_image = req.file;
  }

  // Validate required fields
  if (!logoData?.brand_name) {
    throw new AppError('Brand name is required in request body', 400);
  }

  const result = await generationWorkflowService.initializeLogoGeneration(userId, logoData);

  if (!result?.success) {
    throw new AppError(result?.message, result?.statusCode || 400);
  }

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: result.message,
    data: result,
  });
});

/**
 * POST /api/generations/logo/result/:generationId/:jobId
 * Get logo result and deduct credits
 */
const getLogoResult = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { generationId } = req.params;

  if (!generationId) {
    throw new AppError('Generation ID is required', 400);
  }

  const result = await generationWorkflowService.getLogoResult(userId, generationId);

  if (!result.success) {
    throw new AppError(result.message, result.statusCode || 400);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

// ==================== UTILITY ENDPOINTS ====================

/**
 * GET /api/generations/history
 * Get user's generation history
 */
const getGenerationHistory = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { type = 'all', limit = 20 } = req.query;

  const result = await generationWorkflowService.getUserGenerationHistory(userId, type, Number.parseInt(limit));

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Generation history retrieved successfully',
    data: result,
  });
});

/**
 * GET /api/generations/credits/balance
 * Get user's current credit balance
 */
const getCreditBalance = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  
  const balance = await generationService.getUserCredits(userId);
  const isEmpty = balance <= 0;

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Credit balance retrieved successfully',
    data: {
      balance,
      isEmpty,
      canGenerate: balance > 0,
    },
  });
});

export const generationController = {
  // Poster endpoints
  initiatePoster,
  getPosterResult,
  getPosterFields,
  aiGeneratePosterFields,
  // Logo endpoints
  initiateLogo,
  getLogoResult,
  // Utility endpoints
  getGenerationHistory,
  getCreditBalance,
};

export default generationController;
