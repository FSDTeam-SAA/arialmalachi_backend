/**
 * External API Service - Handles calls to the Python-based Poster/Logo Generation APIs
 * Base URL: https://poster-ai-1.onrender.com
 * 
 * External API Endpoints:
 * POST /generate-poster-complete - Generate poster
 * POST /generate_poster_/result/{job_id} - Get poster result
 * POST /generate-logo - Generate logo
 * POST /generate_logo/result/{job_id} - Get logo result
 * GET /poster_fields/result/{job_id} - Get poster fields
 * POST /ai-generate-poster-fields - AI generate fields
 */

import { openAsBlob } from 'node:fs';

const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'https://poster-ai-1.onrender.com';

class ExternalApiService {
  
  /**
   * Validate response is valid JSON and has required fields
   * @private
   */
  validateResponse(response, requiredFields = []) {
    if (typeof response !== 'object') return false;
    return requiredFields.every(field => field in response);
  }

  /**
   * Generate Poster - Initial request to start poster generation
   * 
   * @param {Object} data - Poster generation parameters
   * @param {string} data.title - Poster title (required)
   * @param {string} [data.subtitle] - Poster subtitle
   * @param {string} [data.description] - Poster description
   * @param {string} [data.brand_name] - Brand name
   * @param {string} [data.primary_color] - Primary color (hex)
   * @param {string} [data.secondary_color] - Secondary color (hex)
   * @param {string} [data.cta] - Call-to-action text
   * @param {string} [data.design_style_prompt] - Design style prompt
   * @param {string} [data.style_preset] - Style preset
   * @param {string} [data.output_format] - Output format (png, jpg, etc)
   * @param {string} [data.language] - Language
   * @param {number} [data.variations] - Number of variations
   * @param {string} [data.image] - Reference image URL
   * @returns {Promise<Object>} - { job_id, status }
   */
  async generatePoster(data) {
    try {
      if (!data.title) {
        throw new Error('Poster title is required');
      }

      const formData = new FormData();
      
      // Append all fields to FormData
      for (const key of Object.keys(data)) {
        const value = data[key];
        if (value === undefined || value === null) continue;

        // Check if value is a multer file object
        if (typeof value === 'object' && value.path && value.originalname) {
          const blob = await openAsBlob(value.path);
          formData.append(key, blob, value.originalname);
        } else {
          formData.append(key, value);
        }
      }

      const response = await fetch(`${EXTERNAL_API_BASE_URL}/generate-poster-complete`, {
        method: 'POST',
        // Note: Content-Type header is NOT set manually for FormData
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.job_id) {
        console.warn('API response missing job_id:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Error calling generatePoster:', error);
      throw error;
    }
  }

  /**
   * Get Poster Result - Retrieve generated poster by job_id
   * @param {string} jobId - Job ID from generatePoster
   * @returns {Promise<Object>} - { poster_url, status, etc }
   */
  async getPosterResult(jobId) {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE_URL}/generate_poster_/result/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json();
      return result; // Should contain poster URL(s)
    } catch (error) {
      console.error('Error calling getPosterResult:', error);
      throw error;
    }
  }

  /**
   * Generate Logo - Initial request to start logo generation
   * 
   * @param {Object} data - Logo generation parameters
   * @param {string} data.brand_name - Brand name (required)
   * @param {string} [data.tagline] - Brand tagline
   * @param {string} [data.vision] - Brand vision
   * @param {string} [data.industry] - Industry type
   * @param {string} [data.logo_style] - Logo style preference
   * @param {string} [data.color_palette] - Color palette (comma-separated hex values)
   * @param {string} [data.language] - Language
   * @param {string} [data.reference_image] - Reference image URL or base64
   * @returns {Promise<Object>} - { job_id, status }
   */
  async generateLogo(data) {
    try {
      if (!data.brand_name) {
        throw new Error('Brand name is required for logo generation');
      }

      const formData = new FormData();
      
      // Append all fields to FormData
      for (const key of Object.keys(data)) {
        const value = data[key];
        if (value === undefined || value === null) continue;

        // Check if value is a multer file object
        if (typeof value === 'object' && value.path && value.originalname) {
          const blob = await openAsBlob(value.path);
          formData.append(key, blob, value.originalname);
        } else {
          formData.append(key, value);
        }
      }

      const response = await fetch(`${EXTERNAL_API_BASE_URL}/generate-logo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.job_id) {
        console.warn('API response missing job_id:', result);
      }
      
      return result;
    } catch (error) {
      console.error('Error calling generateLogo:', error);
      throw error;
    }
  }

  /**
   * Get Logo Result - Retrieve generated logo by job_id
   * @param {string} jobId - Job ID from generateLogo
   * @returns {Promise<Object>} - { logo_url, status, etc }
   */
  async getLogoResult(jobId) {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE_URL}/generate_logo/result/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json();
      return result; // Should contain logo URL(s)
    } catch (error) {
      console.error('Error calling getLogoResult:', error);
      throw error;
    }
  }

  /**
   * Get Poster Fields - Retrieve available fields for poster generation
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - { fields, options, etc }
   */
  async getPosterFields(jobId) {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE_URL}/poster_fields/result/${jobId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error calling getPosterFields:', error);
      throw error;
    }
  }

  /**
   * AI Generate Poster Fields - Generate fields using AI
   * @param {Object} data - Parameters for AI field generation
   * @returns {Promise<Object>} - { fields, suggestions, etc }
   */
  async aiGeneratePosterFields(data) {
    try {
      // Map 'prompt' or other fields to 'idea' as expected by FastAPI
      const payload = {
        idea: data.idea || data.prompt || data.description || 'General poster idea'
      };

      const response = await fetch(`${EXTERNAL_API_BASE_URL}/ai-generate-poster-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error calling aiGeneratePosterFields:', error);
      throw error;
    }
  }
}

export default new ExternalApiService();
