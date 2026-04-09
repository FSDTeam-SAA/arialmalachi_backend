# Poster & Logo Generation Integration Guide

## Overview

This guide explains how to integrate the external Python-based Poster and Logo generation APIs with your Node.js backend, including credit management and URL saving.

---

## Architecture

### Components

1. **External API Service** - Handles HTTP calls to external Python APIs
2. **Generation Workflow Service** - Orchestrates API calls with credit management
3. **Generation Model** - Stores generation records with URLs
4. **Generation Controller** - Handles HTTP requests
5. **Generation Routes** - Defines API endpoints

### Credit System

- **1 credit = 1 generation** (per variant/result)
- Credits are deducted when the final result is retrieved
- Credits are only deducted if generation succeeds
- Users cannot generate if they have no credits
- Credits are per subscription plan

---

## API Endpoints

### Base URL
```
/api/v1/generations
```

All endpoints require authentication (Bearer token in Authorization header).

---

## POSTER GENERATION

### 1. Initiate Poster Generation

**Endpoint:** `POST /poster/initiate`

**Request Body:**
```json
{
  "title": "Summer Sale 2024",
  "title_font": "Arial Bold",
  "subtitle": "Get Up to 50% Off",
  "subtitle_font": "Arial",
  "tagline": "Limited Time Offer",
  "brand_name": "FashionCo",
  "primary_color": "#FF6B9D",
  "secondary_color": "#FFA502",
  "cta": "Shop Now",
  "phone": "+1-800-FASHION",
  "address": "123 Fashion Ave, New York, NY",
  "website": "www.fashionco.com",
  "design_style_prompt": "vibrant and energetic with tropical vibes",
  "style_preset": "bold",
  "output_format": "png",
  "language": "en",
  "variations": 3,
  "image": null
}
```

**Required Fields:**
- `title` - Poster title
- `subtitle` - Poster subtitle
- `brand_name` - Brand/company name
- `primary_color` - Primary color (hex #RRGGBB)
- `secondary_color` - Secondary color (hex #RRGGBB)

**Response:**
```json
{
  "success": true,
  "message": "Poster generation initiated successfully",
  "data": {
    "generationId": "6507a1234567890abcdef",
    "jobId": "job_12345",
    "status": "processing",
    "currentCredits": 99,
    "message": "Poster generation initiated successfully"
  }
}
```

**Status Codes:**
- `201` - Successfully initiated
- `402` - Insufficient credits
- `403` - No active subscription or subscription expired

---

### 2. Get Poster Result

**Endpoint:** `POST /poster/result/:generationId/:jobId`

**Parameters:**
- `generationId` - From initiate response
- `jobId` - From initiate response

**Request Body:** (empty)

**Response:**
```json
{
  "success": true,
  "message": "Poster generated successfully",
  "data": {
    "resultUrls": [
      "https://example.com/poster_v1.png",
      "https://example.com/poster_v2.png",
      "https://example.com/poster_v3.png"
    ],
    "remainingCredits": 98,
    "statusCode": 200
  }
}
```

**Status Codes:**
- `200` - Result retrieved successfully
- `400` - No result URLs found
- `402` - Insufficient credits
- `403` - Unauthorized (not user's generation)
- `404` - Generation record not found

---

### 3. Get Poster Fields

**Endpoint:** `GET /poster/fields/:jobId`

**Parameters:**
- `jobId` - Job ID from initiation

**Response:**
```json
{
  "success": true,
  "message": "Poster fields retrieved successfully",
  "data": {
    "fields": [
      {
        "name": "title",
        "type": "text",
        "maxLength": 100
      },
      {
        "name": "colors",
        "type": "array",
        "options": ["#FF5733", "#33FF57", "#3357FF"]
      }
    ]
  }
}
```

---

### 4. AI Generate Poster Fields

**Endpoint:** `POST /poster/fields/ai-generate`

**Request Body:**
```json
{
  "prompt": "Create a poster for a tech conference",
  "tone": "professional",
  "additionalContext": "Using modern design principles"
}
```

**Response:**
```json
{
  "success": true,
  "message": "AI fields generated successfully",
  "data": {
    "fields": {
      "title": "Tech Conference 2024",
      "description": "Join leading innovators...",
      "colors": ["#1a1a2e", "#0f3460", "#e94560"],
      "style": "modern_minimalist"
    }
  }
}
```

---

## LOGO GENERATION

### 1. Initiate Logo Generation

**Endpoint:** `POST /logo/initiate`

**Request Body:**
```json
{
  "logoData": {
    "companyName": "TechCorp",
    "industry": "technology",
    "style": "modern",
    "colors": ["#0066CC", "#FFFFFF"],
    "shape": "circular"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logo generation initiated successfully",
  "data": {
    "generationId": "6507a1234567890abcdef",
    "jobId": "job_67890",
    "status": "processing",
    "currentCredits": 99
  }
}
```

---

### 2. Get Logo Result

**Endpoint:** `POST /logo/result/:generationId/:jobId`

**Parameters:**
- `generationId` - From initiate response
- `jobId` - From initiate response

**Response:**
```json
{
  "success": true,
  "message": "Logo generated successfully",
  "data": {
    "resultUrls": [
      "https://example.com/logo_v1.png",
      "https://example.com/logo_v2.png"
    ],
    "remainingCredits": 98
  }
}
```

---

## UTILITY ENDPOINTS

### Get Credit Balance

**Endpoint:** `GET /credits/balance`

**Response:**
```json
{
  "success": true,
  "message": "Credit balance retrieved successfully",
  "data": {
    "balance": 45,
    "isEmpty": false,
    "canGenerate": true
  }
}
```

---

### Get Generation History

**Endpoint:** `GET /history?type=poster&limit=20`

**Query Parameters:**
- `type` - `poster`, `logo`, or `all` (default: `all`)
- `limit` - Number of records (default: 20)

**Response:**
```json
{
  "success": true,
  "message": "Generation history retrieved successfully",
  "data": [
    {
      "_id": "6507a1234567890abcdef",
      "generationType": "poster",
      "status": "completed",
      "resultUrls": ["url1", "url2"],
      "creditCost": 1,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Workflow Examples

### Complete Poster Generation Workflow

```javascript
// 1. Initiate generation
const initiateResponse = await fetch('/api/v1/generations/poster/initiate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    posterData: { title: 'Sale', description: 'Great deals' }
  })
});
const { data: initData } = await initiateResponse.json();

// 2. Check credit balance (optional)
const balanceResponse = await fetch('/api/v1/generations/credits/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const balance = await balanceResponse.json();

// 3. Poll for result (in real apps, use WebSocket or polling)
let result = null;
for (let i = 0; i < 30; i++) {
  const resultResponse = await fetch(
    `/api/v1/generations/poster/result/${initData.generationId}/${initData.jobId}`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await resultResponse.json();
  
  if (data.success) {
    result = data.data;
    break;
  }
  
  // Wait 2 seconds before retrying
  await new Promise(r => setTimeout(r, 2000));
}

console.log('Generated URLs:', result.resultUrls);
console.log('Credits remaining:', result.remainingCredits);
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

### Common Errors

| Error | Status | Solution |
|-------|--------|----------|
| Insufficient credits | 402 | User needs to purchase more credits/upgrade plan |
| No active subscription | 403 | User subscription expired or not subscribed |
| Invalid job ID | 404 | Check job_id parameter |
| API timeout | 500 | Retry after delay |
| External API error | 500 | Check external service status |

---

## Database Schema

### Generation Record

```javascript
{
  userId: ObjectId,              // Reference to User
  generationType: String,        // 'poster' or 'logo'
  jobId: String,                 // External API job ID
  status: String,                // 'pending' | 'processing' | 'completed' | 'failed'
  creditCost: Number,            // Credits consumed (default: 1)
  creditDeducted: Boolean,       // Whether credits have been deducted
  inputData: Object,             // Generation parameters sent to external API
  resultUrls: [String],          // Array of generated image URLs
  apiResponse: Object,           // Full response from external API
  error: String,                 // Error message if generation failed
  createdAt: Date,
  updatedAt: Date
}
```

---

## Implementation Checklist

- [x] Create Generation model
- [x] Create External API service
- [x] Create Generation workflow service
- [x] Create Generation controller
- [x] Create Generation routes
- [x] Register routes in app router
- [ ] Set `EXTERNAL_API_BASE_URL` in `.env`
- [ ] Test all endpoints
- [ ] Handle polling/WebSocket for real-time updates
- [ ] Add rate limiting for API calls
- [ ] Implement retry logic for failed API calls
- [ ] Add monitoring/logging

---

## Environment Variables

Add these to your `.env` file:

```env
# External API Configuration
EXTERNAL_API_BASE_URL=https://poster-ai-1.onrender.com

# Credit Configuration (optional)
CREDITS_PER_VARIANT=1

# Polling Configuration (for frontend)
GENERATION_POLL_INTERVAL=2000  # milliseconds
GENERATION_MAX_RETRIES=30
```

---

## Frontend Integration Example

```javascript
// React hook example
const usePosterGeneration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const generatePoster = async (posterData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 1. Initiate
      const initRes = await fetch('/api/v1/generations/poster/initiate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ posterData })
      });
      
      if (!initRes.ok) throw new Error('Failed to initiate');
      
      const { data } = await initRes.json();
      
      // 2. Poll for results
      let completed = false;
      let retries = 0;
      
      while (!completed && retries < 30) {
        await new Promise(r => setTimeout(r, 2000));
        
        const resultRes = await fetch(
          `/api/v1/generations/poster/result/${data.generationId}/${data.jobId}`,
          { 
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        
        const resultData = await resultRes.json();
        
        if (resultData.success) {
          setResults(resultData.data);
          completed = true;
        }
        
        retries++;
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { generatePoster, isLoading, results, error };
};
```

---

## Best Practices

1. **Credit Validation First** - Always check credits before calling external API
2. **Store Job IDs** - Keep track of job_id for result retrieval
3. **Implement Polling** - Use polling or WebSocket for status updates
4. **Handle Failures** - Refund credits if generation fails
5. **Rate Limiting** - Implement rate limits to prevent abuse
6. **Error Logging** - Log all API errors for debugging
7. **Timeout Handling** - Set reasonable timeouts for external API calls
8. **URL Expiration** - Consider implementing URL expiration checks

---

## Troubleshooting

### Generation never completes

1. Check if job_id is correct
2. Verify external API is running
3. Check network connectivity
4. Increase polling retry attempts

### Credits deducted but no result

This shouldn't happen - credits are only deducted when result is successfully retrieved. If it does:

1. Check Generation record status
2. Contact support with generation ID
3. Manual credit refund may be needed

### External API returns error

1. Check API documentation at https://poster-ai-1.onrender.com/docs
2. Verify request format matches expected schema
3. Check for rate limiting from external API
4. Retry with exponential backoff

