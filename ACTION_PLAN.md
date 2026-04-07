# 🚀 ACTION PLAN - Start Using Poster & Logo Generation

## What You Need to Do RIGHT NOW

### ⚡ IMMEDIATE ACTION (2 minutes)

**Edit your `.env` file and add ONE line:**

```env
EXTERNAL_API_BASE_URL=https://poster-ai-1.onrender.com
```

**That's it for setup!** If you're using `npm run dev` with hot reload, changes are automatic. Otherwise, restart:

```bash
npm run dev
```

---

## How It Works (Simple Explanation)

Your users can now:
1. **Click "Generate Poster"** → System checks if they have credits
2. **Wait for result** → External AI generates images
3. **See all variants** → All generated images displayed
4. **1 credit used** → Automatically deducted when they see results

---

## Available Endpoints

### For Frontend Developers

```
GET  /api/v1/generations/credits/balance
     → Check how many credits user has left

POST /api/v1/generations/poster/initiate
     → Start poster generation

POST /api/v1/generations/poster/result/:generationId/:jobId
     → Get generated poster images + deduct 1 credit

POST /api/v1/generations/logo/initiate
     → Start logo generation

POST /api/v1/generations/logo/result/:generationId/:jobId
     → Get generated logo images + deduct 1 credit

GET  /api/v1/generations/history
     → Show user's generation history
```

---

## Frontend Integration Guide

### Simple JavaScript Example

```javascript
// 1. Check if user can generate
async function checkCredits() {
  const res = await fetch('/api/v1/generations/credits/balance', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  
  if (data.data.isEmpty) {
    alert('You need to purchase more credits!');
    return false;
  }
  return true;
}

// 2. Start generation
async function startGeneration(title) {
  const res = await fetch('/api/v1/generations/poster/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      posterData: { title: title }
    })
  });
  
  const data = await res.json();
  return {
    generationId: data.data.generationId,
    jobId: data.data.jobId
  };
}

// 3. Wait for and get results
async function getResults(generationId, jobId) {
  let attempts = 0;
  
  while (attempts < 30) {
    const res = await fetch(
      `/api/v1/generations/poster/result/${generationId}/${jobId}`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    const data = await res.json();
    
    if (data.success) {
      // SUCCESS! Show URLs to user
      console.log('Generated images:', data.data.resultUrls);
      console.log('Credits remaining:', data.data.remainingCredits);
      return data.data;
    }
    
    // Wait 2 seconds and try again
    await new Promise(r => setTimeout(r, 2000));
    attempts++;
  }
}

// Main flow
async function generatePoster(title) {
  if (!await checkCredits()) return;
  
  const { generationId, jobId } = await startGeneration(title);
  const results = await getResults(generationId, jobId);
  
  // Display results to user
  results.resultUrls.forEach(url => {
    let img = new Image();
    img.src = url;
    document.body.appendChild(img);
  });
}

// Usage
generatePoster('Summer Sale');
```

---

## What Files Were Created/Modified

### New Files Created (7 files)
1. `src/lib/externalApiService.js` - Calls external API
2. `src/lib/generationService.js` - Credit management
3. `src/entities/generation/generation.model.js` - Database schema
4. `src/entities/generation/generation.service.js` - Business logic
5. `src/entities/generation/generation.controller.js` - HTTP handlers
6. `src/entities/generation/generation.routes.js` - API routes
7. `src/core/app/appRouter.js` - MODIFIED (added 1 line)

### Documentation Files (5 files)
- `GENERATION_API_GUIDE.md` - Complete API documentation
- `QUICK_START_GENERATION.md` - Quick reference
- `ARCHITECTURE_AND_WORKFLOW.md` - All workflows explained
- `IMPLEMENTATION_COMPLETE.md` - What was done
- `TESTING_CHECKLIST.md` - How to test
- `generation_api_postman_collection.json` - Postman collection

---

## Testing Your Implementation (5 minutes)

### Option 1: Using cURL

```bash
# 1. Check balance
curl -X GET http://localhost:5000/api/v1/generations/credits/balance \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Start poster
curl -X POST http://localhost:5000/api/v1/generations/poster/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"posterData":{"title":"Test"}}'

# 3. Get result (use IDs from above)
curl -X POST http://localhost:5000/api/v1/generations/poster/result/ID_FROM_STEP_2/JOB_ID_FROM_STEP_2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Option 2: Using Postman

1. Import `generation_api_postman_collection.json`
2. Set `base_url` = `http://localhost:5000`
3. Set `token` = your JWT token
4. Click "Get Credit Balance" request and send
5. Click "1. Initiate Poster Generation" and send
6. Copy `generationId` and `jobId` from response
7. Paste into "2. Get Poster Result"
8. Wait 2-3 seconds, then send

---

## Daily Usage Flow

### For Users with Credits

```
User clicks "Generate Poster"
    ↓
System shows form (title, description, etc.)
    ↓
User fills form and clicks "Generate"
    ↓
Backend: Check credits (✓ User has 50)
Backend: Start external API job
Backend: Return jobId to frontend
    ↓
Frontend: Shows "Generating... Please wait"
Frontend: Polls for result every 2 seconds
    ↓
After ~10-30 seconds: Result ready
    ↓
Backend: Deduct 1 credit (50 → 49)
Backend: Save all URLs to database
Backend: Return URLs
    ↓
Frontend: Shows 3 poster variants + "Credits left: 49"
    ↓
User can download or share images
```

### For Users WITHOUT Credits

```
User clicks "Generate Poster"
    ↓
Backend: Check credits (✗ User has 0)
Backend: Return Error 402
    ↓
Frontend: Shows "You need credits to generate!"
         Shows upgrade subscription button
    ↓
User needs to buy more credits first
```

---

## Key Features Implemented

✅ **Two-Step Generation**
- Initiate (no credit deduction)
- Retrieved result (1 credit deducted)

✅ **Automatic Credit Management**
- Checks credits before allowing generation
- Deducts exactly 1 per generation
- Blocks if credits empty
- Tracks in database

✅ **Multi-Variant Support**
- Can generate 2, 3, or more variants
- All URLs stored and returned
- User gets all options

✅ **History Tracking**
- Every generation recorded
- Filter by type (poster/logo)
- See past generations anytime

✅ **Error Handling**
- Clear error messages
- Proper HTTP status codes
- No credits deducted on errors

✅ **Security**
- Authentication required
- User can't access others' generations
- Credit balance validated
- Subscription checked

---

## What Your System Can Now Do

### Generate Posters
- Users initiate poster generation
- Provide custom title, description, colors, images
- Get 2-3 generated variants
- 1 credit per poster

### Generate Logos
- Users initiate logo generation
- Provide company name, industry, style
- Get 2-3 generated logo variants
- 1 credit per logo

### Manage Credits
- Users see remaining credits anytime
- Credits only deducted when viewing results
- Zero credits blocks generation
- History shows all past generations

### Track Everything
- All generations saved in database
- Know what user generated when
- Can refund credits if needed
- Generate reports/analytics

---

## Troubleshooting

### "EXTERNAL_API_BASE_URL is not defined"
→ Add to `.env` file

### "Insufficient credits" error (402)
→ User has 0 credits, needs to purchase more

### Generation times out
→ External API might be slow, try again

### URLs not saving
→ Check external API is responding correctly

### Can't authenticate (401)
→ JWT token expired, user needs to login again

---

## Next Steps (Optional Enhancements)

1. **Add WebSocket** - Real-time generation updates instead of polling
2. **Add Rate Limiting** - Prevent abuse (max 10 generations per hour)
3. **Add Presets** - Save poster templates for quick reuse
4. **Add Analytics** - Track which types of posters are popular
5. **Add Batch Generation** - Generate 5-10 variants at once
6. **Add Image Styles** - Let users choose generation style (realistic, cartoon, etc.)

---

## Files to Share with Team

### For Designers
- `GENERATION_API_GUIDE.md` - Full API docs

### For Frontend Developers
- `QUICK_START_GENERATION.md` - Quick reference + examples
- `generation_api_postman_collection.json` - Postman collection for testing

### For Backend Developers
- `ARCHITECTURE_AND_WORKFLOW.md` - System architecture
- Look at source code in `src/entities/generation/`

### For QA/Testers
- `TESTING_CHECKLIST.md` - Comprehensive test case list

---

## Support Resources

| Need | File |
|------|------|
| How do I use the API? | QUICK_START_GENERATION.md |
| What endpoints are available? | GENERATION_API_GUIDE.md |
| How does credit management work? | ARCHITECTURE_AND_WORKFLOW.md |
| How do I set it up? | IMPLEMENTATION_COMPLETE.md |
| How do I test it? | TESTING_CHECKLIST.md |
| What's the code structure? | src/entities/generation/ |

---

## Success Metrics

Once you've deployed, track:

- ✓ Number of posters generated
- ✓ Number of logos generated
- ✓ Total credits used
- ✓ Average time per generation
- ✓ Error rate
- ✓ User satisfaction

---

## Ready to Go?

1. ✅ Add `EXTERNAL_API_BASE_URL` to `.env`
2. ✅ Verify routes are registered
3. ✅ Test with cURL or Postman
4. ✅ Integrate into frontend
5. ✅ Go live!

---

## Questions? Check Here First

**Q: Where's the API documentation?**
A: `GENERATION_API_GUIDE.md`

**Q: How do I test?**
A: `TESTING_CHECKLIST.md`

**Q: How does the flow work?**
A: `ARCHITECTURE_AND_WORKFLOW.md`

**Q: What needs to be coded on frontend?**
A: See "Frontend Integration Guide" section above

**Q: Can I modify credit cost?**
A: Edit `src/lib/generationService.js`, line with `CREDITS_PER_VARIANT = 1`

**Q: How do I handle errors in frontend?**
A: Check status codes in response (402, 403, 404, etc.)

---

## You're All Set! 🎉

Start generating posters and logos with automatic credit management. Your users will love it!

**Need to get users started?** Share this link in your docs:
```
/api/v1/generations/credits/balance
/api/v1/generations/poster/initiate
/api/v1/generations/poster/result/{generationId}/{jobId}
/api/v1/generations/logo/initiate
/api/v1/generations/logo/result/{generationId}/{jobId}
```

---

**Happy generating!** 🚀
