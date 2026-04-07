# System Architecture & Workflow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React/Vue)                    │
│                                                                  │
│  User clicks "Generate Poster/Logo" → Poll for results          │
└─────────────────────────────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR NODE.JS BACKEND                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    HTTP Routes                            │  │
│  │  POST /api/v1/generations/poster/initiate                │  │
│  │  POST /api/v1/generations/poster/result/:id/:jobId       │  │
│  │  POST /api/v1/generations/logo/initiate                  │  │
│  │  POST /api/v1/generations/logo/result/:id/:jobId         │  │
│  │  GET  /api/v1/generations/credits/balance                │  │
│  │  GET  /api/v1/generations/history                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Generation.Controller                           │  │
│  │  (Validates input, handles responses)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │      GenerationWorkflow.Service (Orchestration)          │  │
│  │                                                          │  │
│  │  1. Validate credits                                    │  │
│  │  2. Call external API                                   │  │
│  │  3. Save to Database                                    │  │
│  │  4. Deduct credits                                      │  │
│  │  5. Return results                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│         ▼                                    ▼                   │
│  ┌──────────────────┐              ┌────────────────────┐      │
│  │ Generation                      │ Generation                 │
│  │ Service (Credit  │              │ Service (External  │      │
│  │ Mgmt)            │              │ API Calls)         │      │
│  │                  │              │                    │      │
│  │ - Validate       │              │ - Generate Poster  │      │
│  │ - Deduct         │              │ - Get Result       │      │
│  │ - Refund         │              │ - Generate Logo    │      │
│  │ - Check Empty    │              │ - Get Logo Result  │      │
│  └──────────────────┘              └────────────────────┘      │
│         ▲                                    ▼                   │
│         │              ┌────────────────────────────┐           │
│         └──────────────┤    MongoDB                 │           │
│                        │                            │           │
│                        │  Users                     │           │
│                        │  (credits, subscription)   │           │
│                        │                            │           │
│                        │  Generations               │           │
│                        │  (URLs, status, history)   │           │
│                        └────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              EXTERNAL PYTHON API SERVICE                         │
│         (https://poster-ai-1.onrender.com)                      │
│                                                                  │
│  POST /generate-poster-complete             ← Initiate         │
│  POST /generate_poster_/result/{job_id}     ← Get Result       │
│  POST /generate-logo                        ← Initiate         │
│  POST /generate_logo/result/{job_id}        ← Get Result       │
│  GET  /poster_fields/result/{job_id}        ← Get Fields       │
│  POST /ai-generate-poster-fields            ← AI Fields        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow: Step-by-Step

### 🔄 Complete Generation Flow

```
START: User has 50 credits
│
├─► STEP 1: POST /poster/initiate
│   │
│   ├─► Authentication middleware checks token ✓
│   │
│   ├─► Generation Controller receives request
│   │
│   ├─► Validates posterData format
│   │
│   ├─► Calls GenerationWorkflow.initiatePosterGeneration()
│   │
│   ├─► Validates user has credits
│   │   ├─► User.findById(userId)
│   │   ├─► Check: isSubscribed = true ✓
│   │   ├─► Check: expiryDate > now ✓
│   │   ├─► Check: credits >= 1 ✓
│   │   └─► Status: PASS ✓
│   │
│   ├─► Calls external API
│   │   └─► POST https://poster-ai-1.onrender.com/generate-poster-complete
│   │       └─► Returns: { job_id: "job_12345" }
│   │
│   ├─► Creates Generation record in DB
│   │   └─► { userId, jobId, status: "processing", creditDeducted: false }
│   │
│   └─► Returns to frontend
│       ├─► generationId: "507f1f77bcf86cd799439011"
│       ├─► jobId: "job_12345"
│       ├─► status: "processing"
│       └─► currentCredits: 50 (NOT deducted yet)
│
├─► WAIT: Frontend polls every 2 seconds (for 30-60 attempts)
│   │
│   └─► Generation processes on external service...
│
├─► STEP 2: POST /poster/result/generationId/jobId
│   │
│   ├─► Checks Generation record exists
│   │
│   ├─► Validates user owns this generation
│   │   └─► generation.userId === req.user.id ✓
│   │
│   ├─► Checks if credits already deducted
│   │   └─► creditDeducted === false ✓
│   │
│   ├─► Calls external API to get result
│   │   └─► POST https://poster-ai-1.onrender.com/generate_poster_/result/job_12345
│   │       └─► Returns: { urls: ["url1.png", "url2.png", "url3.png"] }
│   │
│   ├─► Extracts URLs from response
│   │   └─► resultUrls = ["url1.png", "url2.png", "url3.png"]
│   │
│   ├─► DEDUCTS 1 CREDIT FROM USER ⭐
│   │   ├─► User.findByIdAndUpdate(userId, { $inc: { credits: -1 } })
│   │   ├─► User.credits: 50 → 49
│   │   └─► generationService.deductCredits() called
│   │
│   ├─► Updates Generation record
│   │   ├─► status: "completed"
│   │   ├─► creditDeducted: true
│   │   └─► resultUrls: ["url1.png", "url2.png", "url3.png"]
│   │
│   └─► Returns to frontend
│       ├─► resultUrls: ["url1.png", "url2.png", "url3.png"]
│       ├─► remainingCredits: 49
│       └─► message: "Poster generated successfully"
│
├─► USER SEES RESULTS
│   └─► 3 poster variants + 1 credit remaining
│
└─► END: User has 49 credits left
```

---

## Credit Deduction Logic

### When Credits ARE Deducted ✓
- ✅ User has active subscription
- ✅ Subscription not expired
- ✅ User has at least 1 credit
- ✅ External API returns valid result URLs
- ✅ Generation status is "completed"

### When Credits are NOT Deducted ✗
- ❌ User has no active subscription
- ❌ Subscription expired
- ❌ User has 0 credits
- ❌ At initiation (only at result retrieval)
- ❌ If generation fails
- ❌ If result already retrieved (prevents double-deduction)

---

## Data Flow

### Request from Frontend
```
Frontend (Browser)
    │
    ├─► HTTP Request
    │   ├─ URL: /api/v1/generations/poster/initiate
    │   ├─ Method: POST
    │   ├─ Headers: Authorization: Bearer TOKEN
    │   └─ Body: { posterData: {...} }
    │
    └─► Your Backend (Node.js)
```

### Processing Chain
```
Express App
    ▼
Authentication Middleware
    ├─ Verifies JWT token ✓
    └─ Extracts userId ✓
    ▼
Generation Router
    ├─ Routes to /poster/initiate ✓
    ▼
Generation Controller
    ├─ Validates request body ✓
    ├─ Calls service ✓
    ▼
GenerationWorkflow Service
    ├─ Validates credits ✓
    ├─ Calls external API ✓
    ├─ Creates DB record ✓
    ├─ Returns response ✓
    ▼
Response Formatter (sendResponse)
    ├─ Formats as JSON ✓
    ├─ Sets status code ✓
    ▼
Frontend (Browser)
    └─ Receives: { success, data, message }
```

---

## Database Operations

### User Credit Update
```javascript
// When result is retrieved and credits are deducted
User.findByIdAndUpdate(
  userId,
  { $inc: { credits: -1 } },  // Increment credits by -1
  { new: true, runValidators: true }
)

// Before: User.credits = 50
// After:  User.credits = 49
```

### Generation Record Creation
```javascript
// When generation is initiated
Generation.create({
  userId: ObjectId,
  generationType: "poster",
  jobId: "job_12345",
  status: "processing",
  creditCost: 1,
  creditDeducted: false,
  inputData: { ... },
  resultUrls: [],
  apiResponse: {}
})
```

### Generation Record Update
```javascript
// When result is retrieved
Generation.findByIdAndUpdate(
  generationId,
  {
    status: "completed",
    creditDeducted: true,
    resultUrls: ["url1", "url2", "url3"],
    apiResponse: { ... }
  }
)
```

---

## External API Communication

### Request to External Service
```
YOUR BACKEND
    │
    ├─► HTTP Request (fetch)
    │   ├─ URL: https://poster-ai-1.onrender.com/generate-poster-complete
    │   ├─ Method: POST
    │   ├─ Headers: Content-Type: application/json
    │   └─ Body: { title, description, ... }
    │
    └─► External API (Python)
        │
        └─► Response: { job_id: "job_12345" }
```

### Result Retrieval
```
YOUR BACKEND
    │
    ├─► HTTP Request (fetch)
    │   ├─ URL: https://poster-ai-1.onrender.com/generate_poster_/result/job_12345
    │   ├─ Method: POST
    │   └─ Headers: Content-Type: application/json
    │
    └─► External API (Python)
        │
        └─► Response: { urls: ["url1", "url2", "url3"] }
```

---

## Error Handling Flow

```
User doesn't have credits
    │
    ▼
POST /poster/initiate
    │
    ▼
GenerationWorkflow.initiatePosterGeneration()
    │
    ▼
generationService.validateUserCredits()
    │
    ├─► User.findById(userId)
    ├─► Check credentials
    ├─► Check subscription status
    ├─► Check credit balance
    │
    └─► Returns: { hasCredits: false, message: "Insufficient credits" }
    │
    ▼
Controller receives error
    │
    ├─► Throws AppError("Insufficient credits", 402)
    │
    ▼
Error Handler catches it
    │
    ├─► Formats error response
    │
    ▼
Frontend receives:
{
  "success": false,
  "message": "Insufficient credits. You have 0 credits, but need 1",
  "statusCode": 402
}
```

---

## State Management Summary

### Before Generation
```
User Record:
├─ credits: 50
├─ isSubscribed: true
└─ expiryDate: 2025-12-31

Generation Record: (doesn't exist yet)
```

### After Initiation
```
User Record:
├─ credits: 50 (unchanged)
├─ isSubscribed: true
└─ expiryDate: 2025-12-31

Generation Record:
├─ userId: "..."
├─ jobId: "job_12345"
├─ status: "processing"
├─ creditDeducted: false
├─ creditCost: 1
└─ resultUrls: []
```

### After Result Retrieved
```
User Record:
├─ credits: 49 (decreased by 1)
├─ isSubscribed: true
└─ expiryDate: 2025-12-31

Generation Record:
├─ userId: "..."
├─ jobId: "job_12345"
├─ status: "completed"
├─ creditDeducted: true ⭐
├─ creditCost: 1
└─ resultUrls: ["url1.png", "url2.png", "url3.png"]
```

---

## File Interactions

```
generation.routes.js
    │
    ├─► Routes incoming requests to controllers
    │
    └─► generation.controller.js
        │
        ├─► Validates input
        ├─► Calls services
        ├─► Formats response
        │
        ├─► generation.service.js (Workflow)
        │   │
        │   ├─► Validates credits via generation.service (lib)
        │   ├─► Calls external API via externalApiService
        │   ├─► Manages Generation model
        │   │
        │   ├─► generationService (from lib)
        │   │   ├─► validateUserCredits()
        │   │   ├─► deductCredits()
        │   │   └─► getUserCredits()
        │   │
        │   └─► externalApiService
        │       ├─► generatePoster()
        │       ├─► getPosterResult()
        │       ├─► generateLogo()
        │       └─► getLogoResult()
        │
        └─► Generation Model
            └─► MongoDB collection
```

---

## Security & Validation

```
Request arrives
    │
    ▼
1. Authentication Middleware
   └─► Verify JWT token
   └─► Extract userId
   └─► Attach to req.user
    │
    ▼
2. Route Handler (Controller)
   └─► Validate request body (posterData/logoData exists)
   └─► Type checking
   └─► Length validation
    │
    ▼
3. Service Layer
   └─► Authorization check (user can access generation?)
   └─► Business logic validation (has subscription, credits?)
   └─► Data sanitization
    │
    ▼
4. Database Layer
   └─► MongoDB validation rules
   └─► Type checking
    │
    ▼
5. External API
   └─► Error handling for external failures
   └─► Timeout handling
   └─► Response validation
    │
    ▼
Response
    └─► Error response or success response
```

---

## Summary Matrix

| Component | Purpose | Responsibility |
|-----------|---------|-----------------|
| Frontend | User interaction | Display UI, make HTTP requests, poll results |
| Backend (Node.js) | Orchestration | Validate, coordinate, manage credits, store data |
| MongoDB | Data persistence | Store users, generations, subscriptions |
| External API | Generation | Create posters/logos, return URLs |

---

## Key Invariants

1. **Credits only deducted at result retrieval** (not at initiation)
2. **Each generation has unique jobId** (from external API)
3. **URLs stored immediately** after retrieval
4. **Subscription must be active** to generate
5. **Credits must be >= 1** to start generation
6. **One credit per generation** (configurable)
7. **Generation records immutable** after completion
8. **User can't deduct own credits** (backend-only)

