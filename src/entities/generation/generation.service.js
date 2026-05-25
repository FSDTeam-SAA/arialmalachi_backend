/**
 * Generation Service - Handles poster and logo generation workflow
 * Integrates external API calls with credit management
 */

import mongoose from 'mongoose';
import Generation from './generation.model.js';
import externalApiService from '../../lib/externalApiService.js';
import generationService from '../../lib/generationService.js';

class GenerationWorkflowService {
  async pollForResult(id, getResult, type) {
    const delayMs = 5000; // 5 seconds
    const failedStatuses = new Set(['FAILURE', 'FAILED', 'failed', 'ERROR', 'error']);
    let attempt = 1;

    while (true) {
      try {
        const apiResponse = await getResult(id);
        const urls = this.extractUrls(apiResponse);

        if (urls.length > 0) {
          return urls;
        }

        if (failedStatuses.has(apiResponse?.status)) {
          throw new Error(`${type} task ${id} failed with status: ${apiResponse.status}`);
        }

        console.log(`Task ${id} not ready yet. Status: ${apiResponse?.status || 'unknown'}. Attempt ${attempt}`);
      } catch (err) {
        console.error(`Error fetching ${type} result for task ${id} on attempt ${attempt}:`, err);

        if (err.message?.includes('failed with status')) {
          throw err;
        }
      }

      attempt += 1;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  /**
   * Initialize Poster Generation
   * @param {string} userId - User ID
   * @param {Object} posterData - Poster generation parameters
   * @returns {Promise<Object>} - { jobId, generationId, remainingCredits }
   */
  async initiatePosterGeneration(userId, posterData) {
    try {
      // Calculate credit cost based on requested variations (default to 1)
      const creditCost = Number(posterData.variations) || 1;

      // Step 1: Validate user has enough credits for the number of variations
      const creditValidation = await generationService.validateUserCredits(userId, creditCost);
      if (!creditValidation.hasCredits) {
        return {
          success: false,
          statusCode: creditValidation.statusCode,
          message: creditValidation.message,
        };
      }

      // Step 2: Call external API to start poster generation
      const apiResponse = await externalApiService.generatePoster(posterData);
      
      // Handle single job_id, array task_ids, or singular task_id
      const jobId = apiResponse.job_id || apiResponse.task_ids?.[0] || apiResponse.task_id;
      
      if (!jobId) {
        throw new Error('No job_id or task_ids returned from external API');
      }

      // Step 3: Create generation record in DB
      const generation = await Generation.create({
        userId,
        generationType: 'poster',
        jobId: jobId,
        taskIds: apiResponse.task_ids || (apiResponse.task_id ? [apiResponse.task_id] : [jobId]),
        status: 'processing',
        creditCost: creditCost,
        creditDeducted: false, // Will be deducted when result is fetched
        inputData: posterData,
        apiResponse,
      });

      return {
        success: true,
        generationId: generation._id,
        jobId: apiResponse.job_id,
        status: 'processing',
        currentCredits: creditValidation.currentCredits,
        message: 'Poster generation initiated successfully',
      };
    } catch (error) {
      console.error('Error initiating poster generation:', error);
      throw error;
    }
  }

  /**
   * Get Poster Result and Deduct Credits
   * @param {string} userId - User ID
   * @param {string} generationId - Generation record ID
   * @returns {Promise<Object>} - { resultUrls, remainingCredits, status }
   */
  async getPosterResult(userId, generationId) {
    try {
      // Step 1: Fetch generation record
      const generation = await Generation.findById(generationId);
      if (!generation) {
        return { success: false, message: 'Generation record not found', statusCode: 404 };
      }

      const jobId = generation.jobId; // Use jobId from DB record
      
      if (generation.userId.toString() !== userId) {
        return { success: false, message: 'Unauthorized', statusCode: 403 };
      }

      // Step 2: Validate credits haven't been deducted already
      if (generation.creditDeducted) {
        return {
          success: true,
          resultUrls: generation.resultUrls,
          remainingCredits: await generationService.getUserCredits(userId),
          message: 'Result already retrieved',
          statusCode: 200,
        };
      }

      // Step 3: Call external API to get result for all tasks in parallel, with polling
      const idsToFetch = generation.taskIds?.length > 0 ? generation.taskIds : [jobId];

      const results = await Promise.all(
        idsToFetch.map((id) => this.pollForResult(
          id,
          externalApiService.getPosterResult.bind(externalApiService),
          'poster'
        ))
      );

      const allResultUrls = results.flat();

      if (allResultUrls.length === 0) {
        return {
          success: false,
          message: 'No result URLs found in API response for any tasks',
          statusCode: 400,
        };
      }

      // Step 5: Deduct credits (only if not already deducted)
      const creditDeduction = await generationService.deductCredits(userId, generation.creditCost);

      // Step 6: Update generation record
      await Generation.findByIdAndUpdate(generationId, {
        status: 'completed',
        creditDeducted: true,
        resultUrls: allResultUrls,
        apiResponse: { ...generation.apiResponse, lastResults: allResultUrls },
      });

      return {
        success: true,
        resultUrls: allResultUrls,
        remainingCredits: creditDeduction.remainingCredits,
        message: 'Posters generated successfully',
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error getting poster result:', error);
      
      // Update generation record with error
      if (generationId) {
        await Generation.findByIdAndUpdate(generationId, {
          status: 'failed',
          error: error.message,
        });
      }
      
      throw error;
    }
  }

  /**
   * Initialize Logo Generation
   * @param {string} userId - User ID
   * @param {Object} logoData - Logo generation parameters
   * @returns {Promise<Object>} - { jobId, generationId, remainingCredits }
   */
  async initializeLogoGeneration(userId, logoData) {
    try {
      // Step 1: Validate user has credits
      const creditValidation = await generationService.validateUserCredits(userId);
      if (!creditValidation.hasCredits) {
        return {
          success: false,
          statusCode: creditValidation.statusCode,
          message: creditValidation.message,
        };
      }

      // Step 2: Call external API to start logo generation
      const apiResponse = await externalApiService.generateLogo(logoData);
      
      // Handle single job_id, array task_ids, or singular task_id
      const jobId = apiResponse.job_id || apiResponse.task_ids?.[0] || apiResponse.task_id;
      
      if (!jobId) {
        throw new Error('No job_id or task_ids returned from external API');
      }

      // Step 3: Create generation record in DB
      const generation = await Generation.create({
        userId,
        generationType: 'logo',
        jobId: jobId,
        taskIds: apiResponse.task_ids || (apiResponse.task_id ? [apiResponse.task_id] : [jobId]),
        status: 'processing',
        creditCost: 1,
        creditDeducted: false,
        inputData: logoData,
        apiResponse,
      });

      return {
        success: true,
        generationId: generation._id,
        jobId: apiResponse.job_id,
        status: 'processing',
        currentCredits: creditValidation.currentCredits,
        message: 'Logo generation initiated successfully',
      };
    } catch (error) {
      console.error('Error initiating logo generation:', error);
      throw error;
    }
  }

  /**
   * Get Logo Result and Deduct Credits
   * @param {string} userId - User ID
   * @param {string} generationId - Generation record ID
   * @returns {Promise<Object>} - { resultUrls, remainingCredits, status }
   */
  async getLogoResult(userId, generationId) {
    try {
      // Step 1: Fetch generation record
      const generation = await Generation.findById(generationId);
      if (!generation) {
        return { success: false, message: 'Generation record not found', statusCode: 404 };
      }

      const jobId = generation.jobId; // Use jobId from DB record

      if (generation.userId.toString() !== userId) {
        return { success: false, message: 'Unauthorized', statusCode: 403 };
      }

      // Step 2: Validate credits haven't been deducted already
      if (generation.creditDeducted) {
        return {
          success: true,
          resultUrls: generation.resultUrls,
          remainingCredits: await generationService.getUserCredits(userId),
          message: 'Result already retrieved',
          statusCode: 200,
        };
      }

      // Step 3: Call external API to get result for all tasks in parallel, with polling
      const idsToFetch = generation.taskIds?.length > 0 ? generation.taskIds : [jobId];

      const results = await Promise.all(
        idsToFetch.map((id) => this.pollForResult(
          id,
          externalApiService.getLogoResult.bind(externalApiService),
          'logo'
        ))
      );

      const allResultUrls = results.flat();

      if (allResultUrls.length === 0) {
        return {
          success: false,
          message: 'No result URLs found in API response for any tasks',
          statusCode: 400,
        };
      }

      // Step 5: Deduct credits
      const creditDeduction = await generationService.deductCredits(userId, generation.creditCost);

      // Step 6: Update generation record
      await Generation.findByIdAndUpdate(generationId, {
        status: 'completed',
        creditDeducted: true,
        resultUrls: allResultUrls,
        apiResponse: { ...generation.apiResponse, lastResults: allResultUrls },
      });

      return {
        success: true,
        resultUrls: allResultUrls,
        remainingCredits: creditDeduction.remainingCredits,
        message: 'Logos generated successfully',
        statusCode: 200,
      };
    } catch (error) {
      console.error('Error getting logo result:', error);
      
      // Update generation record with error
      if (generationId) {
        await Generation.findByIdAndUpdate(generationId, {
          status: 'failed',
          error: error.message,
        });
      }
      
      throw error;
    }
  }

  /**
   * Get Poster Fields
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Available fields for poster
   */
  async getPosterFields(jobId) {
    try {
      return await externalApiService.getPosterFields(jobId);
    } catch (error) {
      console.error('Error getting poster fields:', error);
      throw error;
    }
  }

  /**
   * AI Generate Poster Fields
   * @param {string} userId - User ID (optional, for logging)
   * @param {Object} data - Parameters for field generation
   * @returns {Promise<Object>} - Generated fields
   */
  async aiGeneratePosterFields(userId, data) {
    try {
      return await externalApiService.aiGeneratePosterFields(data);
    } catch (error) {
      console.error('Error in AI generate poster fields:', error);
      throw error;
    }
  }

  /**
   * Extract URLs from API response
   * Adjust this based on your actual API response format
   * @param {Object} response - API response
   * @returns {Array<string>} - Extracted URLs
   */
  extractUrls(response) {
    const urls = [];

    // Adjust these paths based on your actual API response structure
    if (Array.isArray(response)) {
      // If response is array of URLs
      return response.filter(item => typeof item === 'string' && item.startsWith('http'));
    }

    if (response.urls && Array.isArray(response.urls)) {
      return response.urls;
    }

    if (response.url && typeof response.url === 'string') {
      return [response.url];
    }

    if (response.result_url && typeof response.result_url === 'string') {
      return [response.result_url];
    }

    if (response.image_url && typeof response.image_url === 'string') {
      return [response.image_url];
    }

    if (response.imageUrl && typeof response.imageUrl === 'string') {
      return [response.imageUrl];
    }

    if (response.poster_urls && Array.isArray(response.poster_urls)) {
      return response.poster_urls;
    }

    if (response.logo_urls && Array.isArray(response.logo_urls)) {
      return response.logo_urls;
    }

    if (response.poster_url) {
      return [response.poster_url];
    }

    if (response.logo_url) {
      return [response.logo_url];
    }

    // Check for nested URLs
    if (response.data && Array.isArray(response.data)) {
      return response.data.filter(item => typeof item === 'string' && item.startsWith('http'));
    }

    return urls;
  }

  /**
   * Get generation history for user
   * @param {string} userId - User ID
   * @param {string} generationType - 'poster', 'logo', or 'all'
   * @param {number} limit - Number of records to return
   * @returns {Promise<Array>} - Generation records
   */
  async getUserGenerationHistory(userId, generationType = 'all', limit = 20) {
    try {
      const query = { userId };
      
      if (generationType !== 'all') {
        query.generationType = generationType;
      }

      return await Generation.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('generationType status resultUrls creditCost createdAt');
    } catch (error) {
      console.error('Error fetching generation history:', error);
      throw error;
    }
  }

  /**
   * Delete a specific generation record for user
   * @param {string} userId - User ID
   * @param {string} generationId - Generation ID
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async deleteUserGeneration(userId, generationId) {
    try {
      const result = await Generation.findOneAndDelete({ _id: generationId, userId });
      return !!result;
    } catch (error) {
      console.error('Error deleting generation:', error);
      throw error;
    }
  }

  /**
   * Get dashboard overview for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Dashboard analytics
   */
  async getUserDashboardOverview(userId) {
    try {
      const pipeline = [
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            totalDesigns: { $sum: 1 },
            totalPosters: {
              $sum: { $cond: [{ $eq: ['$generationType', 'poster'] }, 1, 0] }
            },
            totalLogos: {
              $sum: { $cond: [{ $eq: ['$generationType', 'logo'] }, 1, 0] }
            },
            totalCreditsUsed: {
              $sum: { $cond: ['$creditDeducted', '$creditCost', 0] }
            }
          }
        }
      ];

      const result = await Generation.aggregate(pipeline);
      return result[0] || {
        totalDesigns: 0,
        totalPosters: 0,
        totalLogos: 0,
        totalCreditsUsed: 0
      };
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }
}

export default new GenerationWorkflowService();
