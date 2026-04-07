# Quick Start Guide - Poster & Logo Generation

## What You Now Have

Your backend is now fully integr integrated with the external Python APIs for poster and logo generation, with automatic credit management.

---

## Key Features

✅ **Automatic Credit Management**
- 1 credit per generation
- Credits deducted only when result is retrieved
- Blocks generation if user has no credits
- Credits tracked per user subscription

✅ **Multiple Result Variants**
- Saves all generated URLs (v1, v2, v3, etc.)
- No limit on variants

✅ **Generation Tracking**
- Every generation is recorded in database
- Full history available
- Track success/failure status

✅ **Error Handling**
- Graceful handling of failed generations
- Proper HTTP status codes
- Clear error messages

---

## How It Works: 2-Step Process

### Step 1: Initiate Generation
```bash
POST /api/v1/generations/poster/initiate
POST /api/v1/generations/logo/initiate
```

**What happens:**
1. Check if user has credits ✓
2. Call external API to start generation
3. Return job_id for tracking
4. NO credits deducted yet

**Response includes:**
- `generationId` - Save this for step 2
- `jobId` - Job ID from external API
- `status` - Will be "processing"
- `currentCredits` - How many credits user has left

---

### Step 2: Get Result & Deduct Credits
```bash
POST /api/v1/generations/poster/result/:generationId/:jobId
POST /api/v1/generations/logo/result/:generationId/:jobId
```

**What happens:**
1. Check if generation exists
2. Call external API to get result
3. Deduct 1 credit from user
4. Save all URLs in database
5. Return URLs to user

**Response includes:**
- `resultUrls` - Array of all generated image URLs
- `remainingCredits` - How many credits left after deduction
- `status` - "completed"

---

## Simple Example (Frontend Code)

```javascript
// User clicks "Generate Poster" button
async function generatePoster(title, description) {
  const token = localStorage.getItem('token');
  
  // STEP 1: Start generation
  const initResponse = await fetch('/api/v1/generations/poster/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      posterData: {
        title: title,
        description: description
      }
    })
  });

  if (!initResponse.ok) {
    alert('Failed to start generation. Check your credits!');
    return;
  }

  const initData = await initResponse.json();
  const { generationId, jobId } = initData.data;

  console.log(`Generation started! Waiting for result...`);
  console.log(`Generation ID: ${generationId}`);
  console.log(`Job ID: ${jobId}`);

  // STEP 2: Wait for result (poll every 2 seconds)
  let attempts = 0;
  const maxAttempts = 30; // Wait up to 60 seconds

  while (attempts < maxAttempts) {
    attempts++;
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check result
    const resultResponse = await fetch(
      `/api/v1/generations/poster/result/${generationId}/${jobId}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const resultData = await resultResponse.json();

    if (resultData.success) {
      // SUCCESS! Credits have been deducted
      console.log('Generation complete!');
      console.log('Generated URLs:', resultData.data.resultUrls);
      console.log('Credits remaining:', resultData.data.remainingCredits);
      
      // Display images to user
      resultData.data.resultUrls.forEach((url, index) => {
        console.log(`Variant ${index + 1}: ${url}`);
      });
      
      return resultData.data;
    }

    console.log(`Waiting... (attempt ${attempts}/${maxAttempts})`);
  }

  alert('Generation timed out. Please try again.');
}
```

---

## Check User's Credits Anytime

```bash
GET /api/v1/generations/credits/balance
```

**Response:**
```json
{
  "balance": 45,
  "isEmpty": false,
  "canGenerate": true
}
```

---

## View Generation History

```bash
GET /api/v1/generations/history?type=poster&limit=10
```

**Query options:**
- `type=poster` - Only posters
- `type=logo` - Only logos  
- `type=all` - Everything (default)
- `limit=20` - How many to return

---

## Environment Setup

### 1. Add to your `.env` file:

```env
EXTERNAL_API_BASE_URL=https://poster-ai-1.onrender.com
```

### 2. No need to restart if using hot-reload, but if needed:

```bash
npm run dev
```

---

## Files Created/Modified

### New Files:
- `src/lib/externalApiService.js` - Calls external APIs
- `src/lib/generationService.js` - Credit validation & deduction
- `src/entities/generation/generation.model.js` - Database schema
- `src/entities/generation/generation.service.js` - Workflow logic
- `src/entities/generation/generation.controller.js` - HTTP handlers
- `src/entities/generation/generation.routes.js` - API routes
- `GENERATION_API_GUIDE.md` - Full documentation

### Modified Files:
- `src/core/app/appRouter.js` - Added generation routes (1 line)

---

## API Response Status Codes

| Code | Meaning |
|------|---------|
| 201 | Generation initiated successfully |
| 200 | Result retrieved successfully |
| 400 | Bad request (missing data) |
| 402 | Insufficient credits |
| 403 | No active subscription or unauthorized |
| 404 | Generation record not found |
| 500 | Server error |

---

## What Happens with Credits

### Scenario 1: User has 50 credits
1. Initiates poster generation → Still 50 credits (nothing deducted yet)
2. Gets result → Now 49 credits (1 credit deducted)

### Scenario 2: User has 1 credit
1. Initiates poster generation → Successfully initiated
2. Gets result → Now 0 credits (1 credit deducted)
3. Tries to initiate logo → Error: "Insufficient credits"

### Scenario 3: User has 0 credits
1. Tries to initiate poster → Error: "Insufficient credits" (402)
2. Can still view history and past generations

---

## Testing with cURL

### 1. Check balance:
```bash
curl -X GET http://localhost:5000/api/v1/generations/credits/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Initiate poster:
```bash
curl -X POST http://localhost:5000/api/v1/generations/poster/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "posterData": {
      "title": "Test Poster",
      "description": "This is a test"
    }
  }'
```

### 3. Get result (use IDs from previous response):
```bash
curl -X POST http://localhost:5000/api/v1/generations/poster/result/GENERATION_ID/JOB_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Next Steps

1. ✅ Update `.env` with `EXTERNAL_API_BASE_URL`
2. ✅ Test endpoints with Postman or cURL
3. ✅ Integrate into frontend (use example code above)
4. ✅ Add WebSocket for real-time updates (optional)
5. ✅ Monitor credit usage
6. ✅ Handle error cases
7. ✅ Add rate limiting if needed

---

## Troubleshooting

**Q: Credits deducted but no images?**
- Check Generation record in DB
- Check if external API returned valid URLs
- Try again with valid data

**Q: "Insufficient credits" error?**
- Check balance with `/credits/balance` endpoint
- User needs to purchase more credits
- Check subscription status

**Q: Generation takes too long?**
- Increase polling attempts from 30 to 60
- External API might be processing
- Check external service status

**Q: Getting authorization errors?**
- Verify Bearer token is included
- Check if user is authenticated
- Token might be expired

---

## File Structure

```
src/entities/generation/
├── generation.model.js         # Database schema
├── generation.service.js       # Business logic
├── generation.controller.js    # HTTP handlers
└── generation.routes.js        # API endpoints

src/lib/
├── externalApiService.js       # External API calls
└── generationService.js        # Credit management

GENERATION_API_GUIDE.md         # Full documentation (this file)
```

---

## Need Help?

1. Check `GENERATION_API_GUIDE.md` for detailed documentation
2. Review the controller code for request/response formats
3. Check database records with `db.generation.find()`
4. Enable verbose logging in services

---

Good luck! 🚀
