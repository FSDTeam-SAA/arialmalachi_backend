# Implementation & Testing Checklist

## ✅ Setup Checklist

### Phase 1: Environment Configuration
- [ ] Add `EXTERNAL_API_BASE_URL=https://poster-ai-1.onrender.com` to `.env` file
- [ ] Verify `.env` file is in root directory
- [ ] Restart development server (`npm run dev`)
- [ ] Verify no console errors related to undefined environment variables

### Phase 2: Database Requirements
- [ ] MongoDB is running and accessible
- [ ] `Generation` collection is created (auto-created by Mongoose)
- [ ] `User` collection already exists with `credits` field
- [ ] Can connect to database without issues

### Phase 3: Authentication
- [ ] Have valid JWT tokens for testing
- [ ] Know how to get auth token (login endpoint works)
- [ ] Auth middleware is protecting routes
- [ ] Can decode/verify JWT tokens in Postman

### Phase 4: File Structure Verification
- [ ] `src/lib/externalApiService.js` exists
- [ ] `src/lib/generationService.js` exists
- [ ] `src/entities/generation/` directory exists
- [ ] `src/entities/generation/generation.model.js` exists
- [ ] `src/entities/generation/generation.service.js` exists
- [ ] `src/entities/generation/generation.controller.js` exists
- [ ] `src/entities/generation/generation.routes.js` exists
- [ ] `src/core/app/appRouter.js` has generation routes imported

---

## ✅ Pre-Testing Checklist

### Credential Verification
- [ ] Have at least one test user with active subscription
- [ ] Test user has credits > 0
- [ ] Test user subscription not expired
- [ ] Can generate JWT token for test user
- [ ] Can authenticate with JWT token

### External API Verification
- [ ] External API is accessible (test in browser)
- [ ] Try: `https://poster-ai-1.onrender.com/docs` - should show Swagger
- [ ] External API is not rate-limited from your IP
- [ ] Network allows outbound HTTPS requests

### Postman Setup
- [ ] Imported `generation_api_postman_collection.json`
- [ ] Set `base_url` variable to `http://localhost:5000`
- [ ] Set `token` variable to valid JWT token
- [ ] Can send test requests without auth errors

---

## ✅ Testing Phase 1: Basic Connectivity

### Test 1.1: Check Credits Balance
**Endpoint:** `GET /api/v1/generations/credits/balance`

**Steps:**
1. Open Postman
2. Set auth method to Bearer Token
3. Paste JWT token
4. Send GET request to `/api/v1/generations/credits/balance`

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "balance": 50,
    "isEmpty": false,
    "canGenerate": true
  }
}
```

**Troubleshooting:**
- [ ] If 401: Invalid/expired token
- [ ] If 404: Route not registered (check appRouter.js)
- [ ] If balance is 0: Need more credits

### Test 1.2: Get Generation History (Empty)
**Endpoint:** `GET /api/v1/generations/history`

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": []
}
```

**Troubleshooting:**
- [ ] If error: Check MongoDB connection

---

## ✅ Testing Phase 2: Poster Generation

### Test 2.1: Initiate Poster Generation
**Endpoint:** `POST /api/v1/generations/poster/initiate`

**Steps:**
1. In Postman, select POST method
2. URL: `http://localhost:5000/api/v1/generations/poster/initiate`
3. Body (raw JSON):
```json
{
  "posterData": {
    "title": "Summer Sale",
    "description": "Get amazing deals"
  }
}
```
4. Send request

**Expected Response (Status 201):**
```json
{
  "success": true,
  "data": {
    "generationId": "507f1f77bcf86cd799439011",
    "jobId": "job_12345",
    "status": "processing",
    "currentCredits": 50
  }
}
```

- [ ] Response has generationId ✓
- [ ] Response has jobId ✓
- [ ] Status is "processing" ✓
- [ ] Credits unchanged (still 50) ✓
- [ ] Message is clear ✓

**Troubleshooting:**
- [ ] If 402: User has insufficient credits
- [ ] If 403: No active subscription
- [ ] If 500: Check external API connection

### Test 2.2: Check Generation Was Created
**Database Query:**
```javascript
db.generations.findOne({ jobId: "job_12345" })
```

**Expected Fields:**
- [ ] userId matches test user ✓
- [ ] generationType: "poster" ✓
- [ ] status: "processing" ✓
- [ ] creditDeducted: false ✓
- [ ] resultUrls: [] (empty) ✓
- [ ] apiResponse has jobId ✓

### Test 2.3: Wait for Processing
**Steps:**
1. Wait 5-10 seconds (external API processing)
2. Check Again: `db.generations.findOne({ jobId: "job_12345" })` 
3. Status might still be "processing" (that's OK)

### Test 2.4: Get Poster Result
**Endpoint:** `POST /api/v1/generations/poster/result/{generationId}/{jobId}`

**Steps:**
1. Use generationId and jobId from Test 2.1
2. Send POST request (empty body)
3. May need to retry if still processing

**Expected Response (Status 200):**
```json
{
  "success": true,
  "data": {
    "resultUrls": [
      "https://example.com/poster_v1.png",
      "https://example.com/poster_v2.png"
    ],
    "remainingCredits": 49
  }
}
```

- [ ] Has resultUrls array ✓
- [ ] URLs are valid strings ✓
- [ ] remainingCredits is 49 (decreased by 1) ✓
- [ ] Status 200 ✓

**If Still Processing (Status 202 or similar):**
- [ ] That's normal, retry in 2-3 seconds
- [ ] Re-run same request with same parameters
- [ ] Should not deduct credits twice

### Test 2.5: Verify Credits Were Deducted
**Steps:**
1. Check balance again: `GET /api/v1/generations/credits/balance`
2. Should be 49 (not 50)

**Expected:**
- [ ] balance: 49 ✓
- [ ] canGenerate: true ✓

### Test 2.6: Check Generation Record Updated
**Database Query:**
```javascript
db.generations.findOne({ jobId: "job_12345" })
```

**Expected Changes:**
- [ ] status: "completed" (changed from "processing") ✓
- [ ] creditDeducted: true (changed from false) ✓
- [ ] resultUrls: ["url1", "url2", ...] (populated) ✓
- [ ] apiResponse: populated ✓

### Test 2.7: Get Same Result Again (Shouldn't Deduct Again)
**Steps:**
1. Call same endpoint again with same generationId/jobId
2. Check balance

**Expected:**
- [ ] Still returns resultUrls ✓
- [ ] Balance still 49 (NOT 48) ✓
- [ ] Status 200 ✓
- [ ] Message: "Result already retrieved" ✓

---

## ✅ Testing Phase 3: Logo Generation

### Test 3.1: Initiate Logo Generation
**Endpoint:** `POST /api/v1/generations/logo/initiate`

**Steps:**
1. Check balance first (should be 49)
2. Send request with logoData

**Request Body:**
```json
{
  "logoData": {
    "companyName": "TechCorp",
    "industry": "technology"
  }
}
```

**Expected Response (Status 201):**
```json
{
  "success": true,
  "data": {
    "generationId": "507f1f77bcf86cd799439012",
    "jobId": "job_67890",
    "status": "processing",
    "currentCredits": 49
  }
}
```

- [ ] Response received ✓
- [ ] Credits unchanged (still 49) ✓
- [ ] New generationId and jobId ✓

### Test 3.2: Get Logo Result
**Endpoint:** `POST /api/v1/generations/logo/result/{generationId}/{jobId}`

**Wait a few seconds, then send request**

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "resultUrls": ["https://example.com/logo.png"],
    "remainingCredits": 48
  }
}
```

- [ ] resultUrls populated ✓
- [ ] Credits decreased to 48 ✓

### Test 3.3: Check Final Balance
**Endpoint:** `GET /api/v1/generations/credits/balance`

**Expected:**
- [ ] balance: 48 ✓
- [ ] canGenerate: true ✓

---

## ✅ Testing Phase 4: Error Cases

### Test 4.1: Insufficient Credits
**Setup:** Use user with 0 credits
- [ ] Try to initiate poster
- [ ] Expect Status: 402
- [ ] Message: "Insufficient credits"

### Test 4.2: No Active Subscription
**Setup:** Use user without active subscription
- [ ] Try to initiate poster
- [ ] Expect Status: 403
- [ ] Message: "No active subscription"

### Test 4.3: Expired Subscription
**Setup:** Use user whose subscription expired
- [ ] Try to initiate poster
- [ ] Expect Status: 403
- [ ] Message: "Subscription has expired"

### Test 4.4: Invalid JWT Token
**Setup:** Send request with wrong/expired token
- [ ] Expect Status: 401
- [ ] Message: "Unauthorized"

### Test 4.5: Missing Required Data
**Setup:** POST to initiate without posterData
```json
{}
```
- [ ] Expect Status: 400
- [ ] Message: "Poster data is required"

### Test 4.6: Wrong Generation ID
**Setup:** Use non-existent generationId
- [ ] Expect Status: 404
- [ ] Message: "Generation record not found"

### Test 4.7: Unauthorized Access
**Setup:** User A tries to get User B's generation result
- [ ] Expect Status: 403
- [ ] Message: "Unauthorized"

---

## ✅ Testing Phase 5: History & Analytics

### Test 5.1: Get Generation History
**Endpoint:** `GET /api/v1/generations/history`

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f...",
      "generationType": "poster",
      "status": "completed",
      "resultUrls": ["url1", "url2"],
      "creditCost": 1,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f...",
      "generationType": "logo",
      "status": "completed",
      "resultUrls": ["url3"],
      "creditCost": 1,
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ]
}
```

- [ ] Returns both poster and logo ✓
- [ ] Most recent first ✓
- [ ] All fields present ✓

### Test 5.2: Filter History by Type
**Endpoint:** `GET /api/v1/generations/history?type=poster`

**Expected:**
- [ ] Only poster records returned ✓
- [ ] Logo record excluded ✓

### Test 5.3: Limit Results
**Endpoint:** `GET /api/v1/generations/history?limit=1`

**Expected:**
- [ ] Only 1 record returned ✓
- [ ] Most recent one ✓

---

## ✅ Testing Phase 6: Edge Cases

### Test 6.1: Multiple Credits Deducted Per Variant
**Scenario:** Same user generates multiple posters
- [ ] Initiate poster 1 → Credits OK
- [ ] Get result 1 → Credits -1 (49 → 48)
- [ ] Initiate poster 2 → Still works
- [ ] Get result 2 → Credits -1 (48 → 47)
- [ ] Initiate poster 3 → Still works
- [ ] Get result 3 → Credits -1 (47 → 46)

**Verify:**
- [ ] Each deduction is exactly 1 credit ✓
- [ ] No double-deductions ✓
- [ ] All records in database ✓

### Test 6.2: Zero Credits Blocking
**Setup:** User with 0 credits
- [ ] Try initiate poster
- [ ] Expect 402 error ✓
- [ ] Cannot proceed ✓

### Test 6.3: Rapid Fire Requests
**Steps:**
1. Send 3 initiate requests rapidly
2. Should all succeed
3. Credits not affected yet
4. Get results for each
5. Each deducts 1 credit

**Verify:**
- [ ] Can initiate multiple ✓
- [ ] Results deduct correctly ✓
- [ ] No race conditions ✓

### Test 6.4: Large Result Sets
**Scenario:** External API returns many URLs
- [ ] Verify all URLs stored ✓
- [ ] All URLs returned to user ✓
- [ ] No truncation ✓

---

## ✅ Performance Testing

### Test 7.1: Response Time - Initiate
**Measure:** Time from request to response
- [ ] Should be < 1 second ✓
- [ ] (External API call included) ✓

### Test 7.2: Response Time - Get Result
**Measure:** Time for second call
- [ ] Should be < 1 second ✓

### Test 7.3: Database Query Performance
**Measure:** History query with many records
- [ ] Should return within 1 second ✓
- [ ] Even with 1000+ records ✓

### Test 7.4: Concurrent Users
**Measure:** Multiple users generating simultaneously
- [ ] No race conditions ✓
- [ ] Each user's credits deducted correctly ✓
- [ ] No mixing of user data ✓

---

## ✅ Data Integrity Testing

### Test 8.1: Credits Never Negative
**Steps:**
1. User with 1 credit
2. Generate poster
3. Generate logo
- [ ] Expect error on second generation ✓
- [ ] Credits stay 0, not negative ✓

### Test 8.2: URLs Only Saved on Success
**Steps:**
1. Start generation
2. Force external API error
3. Check record
- [ ] resultUrls should be empty ✓
- [ ] status should be "failed" ✓
- [ ] creditDeducted should be false ✓

### Test 8.3: No Orphaned Records
**Steps:**
1. Delete user from database
2. Check generations for that user
- [ ] Should have records (FK not enforced) ✓
3. Or verify cascading delete works ✓

---

## ✅ Post-Testing Checklist

### Before Going to Production
- [ ] All tests passed
- [ ] No console errors
- [ ] Database has expected records
- [ ] Logs show correct flow
- [ ] Error cases handled gracefully
- [ ] Performance acceptable
- [ ] Security validated

### Documentation
- [ ] README updated with new endpoints
- [ ] Team notified of new features
- [ ] API documentation shared
- [ ] Testing results documented
- [ ] Known issues documented

### Monitoring Setup
- [ ] Logging configured for generations
- [ ] Error tracking enabled
- [ ] Database monitoring active
- [ ] External API failures monitored
- [ ] Credit deductions logged

---

## ✅ Detailed Test Results Template

Fill this out for your records:

```
Date: _______________
Tester: ______________
Environment: Development / Staging / Production

=== Phase 1: Basics ===
✓/✗  1.1 Check Credits Balance
✓/✗  1.2 Get History (empty)

=== Phase 2: Poster ===
✓/✗  2.1 Initiate Poster
✓/✗  2.2 DB Record Created
✓/✗  2.3 Wait Processing
✓/✗  2.4 Get Poster Result
✓/✗  2.5 Credits Deducted
✓/✗  2.6 DB Record Updated
✓/✗  2.7 No Double Deduction

=== Phase 3: Logo ===
✓/✗  3.1 Initiate Logo
✓/✗  3.2 Get Logo Result
✓/✗  3.3 Final Balance

=== Phase 4: Errors ===
✓/✗  4.1 Insufficient Credits
✓/✗  4.2 No Subscription
✓/✗  4.3 Expired Subscription
✓/✗  4.4 Invalid Token
✓/✗  4.5 Missing Data
✓/✗  4.6 Wrong Gen ID
✓/✗  4.7 Unauthorized Access

=== Phase 5: History ===
✓/✗  5.1 Get History
✓/✗  5.2 Filter by Type
✓/✗  5.3 Limit Results

=== Phase 6: Edge Cases ===
✓/✗  6.1 Multiple Credits
✓/✗  6.2 Zero Credits Block
✓/✗  6.3 Rapid Requests
✓/✗  6.4 Many URLs

=== Phase 7: Performance ===
✓/✗  7.1 Initiate Speed: ___ms
✓/✗  7.2 Result Speed: ___ms
✓/✗  7.3 History Speed: ___ms
✓/✗  7.4 Concurrent Users

=== Phase 8: Data Integrity ===
✓/✗  8.1 No Negative Credits
✓/✗  8.2 URLs on Success Only
✓/✗  8.3 No Orphaned Records

Overall: ✓ PASS / ✗ FAIL

Issues Found:
1. ___________________
2. ___________________
3. ___________________

Next Steps:
1. ___________________
2. ___________________
```

---

## 🎯 Troubleshooting Quick Reference

| Problem | Solution | Check |
|---------|----------|-------|
| 401 Unauthorized | Invalid/expired token | JWT token validity |
| 402 Insufficient Credits | User needs credits | User.credits >= 1 |
| 403 No Subscription | Subscription expired/missing | User.isSubscribed, expiryDate |
| 404 Generation Not Found | Wrong ID or record missing | generationId and jobId |
| 500 External API Error | External service down | API status page |
| Credits not deducting | Check if result is retrieved | creditDeducted flag |
| URLs not saving | External API error | Check apiResponse in DB |
| Slow responses | External API processing | Wait longer or check logs |

---

## ✅ Sign-Off Checklist

- [ ] All tests completed and documented
- [ ] All issues resolved or documented
- [ ] Team approves implementation
- [ ] Ready for production deployment
- [ ] Documentation complete
- [ ] Monitoring setup verified
- [ ] Backup plan ready

---

**READY TO DEPLOY!** 🚀
