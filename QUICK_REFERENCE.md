# Updated API - Quick Reference Card

Print or bookmark this page for quick reference!

---

## 📋 Endpoint Summary

```
POST /api/v1/generations/poster/initiate        → Start poster generation
POST /api/v1/generations/logo/initiate          → Start logo generation
POST /api/v1/generations/poster/result/{id}/{jobId}   → Get poster + deduct credits
POST /api/v1/generations/logo/result/{id}/{jobId}     → Get logo + deduct credits
GET  /api/v1/generations/credits/balance       → Check credit balance
GET  /api/v1/generations/history                → View generation history
```

---

## 🎨 Poster Generation

### REQUIRED Field
```
✓ title: string
```

### OPTIONAL Fields
```
subtitle: string
description: string
brand_name: string
primary_color: string (#RRGGBB)
secondary_color: string (#RRGGBB)
cta: string
design_style_prompt: string
style_preset: string
output_format: string (png, jpg, webp)
language: string (en, es, fr, de, etc)
variations: number (1-5)
image: string (URL or null)
```

### Example
```bash
curl -X POST http://localhost:5000/api/v1/generations/poster/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Sale",
    "primary_color": "#FF0000",
    "variations": 3
  }'
```

---

## 🏢 Logo Generation

### REQUIRED Field
```
✓ brand_name: string
```

### OPTIONAL Fields
```
tagline: string
vision: string
industry: string
logo_style: string
color_palette: string (#FF0000,#00FF00,#0000FF)
language: string (en, es, fr, de, etc)
reference_image: string (URL or null)
```

### Example
```bash
curl -X POST http://localhost:5000/api/v1/generations/logo/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "TechCorp",
    "logo_style": "modern",
    "color_palette": "#0066CC,#38BDF8"
  }'
```

---

## 📊 Response Format

### Initiate Response (201)
```json
{
  "success": true,
  "message": "Poster generation initiated successfully",
  "data": {
    "generationId": "507f1f77bcf86cd799439011",
    "jobId": "job_12345",
    "status": "processing",
    "currentCredits": 50
  }
}
```

### Get Result Response (200)
```json
{
  "success": true,
  "message": "Poster generated successfully",
  "data": {
    "resultUrls": [
      "https://example.com/poster_v1.png",
      "https://example.com/poster_v2.png"
    ],
    "remainingCredits": 49
  }
}
```

### Error Response (400/402/403)
```json
{
  "success": false,
  "message": "Poster title is required in request body",
  "statusCode": 400
}
```

---

## ⚡ Common Mistakes

### ❌ WRONG - Don't wrap fields
```json
{
  "posterData": { "title": "..." }
}
```

### ✅ RIGHT - Send fields directly
```json
{
  "title": "..."
}
```

---

### ❌ WRONG - Invalid color
```json
{
  "primary_color": "red"
}
```

### ✅ RIGHT - Use hex format
```json
{
  "primary_color": "#FF0000"
}
```

---

### ❌ WRONG - Single color
```json
{
  "color_palette": "#FF0000"
}
```

### ✅ RIGHT - Comma-separated colors
```json
{
  "color_palette": "#FF0000,#00FF00,#0000FF"
}
```

---

## 🔄 Complete Workflow

```
1. POST /poster/initiate
   Response: { generationId, jobId }
   
2. Wait 2-5 seconds
   
3. POST /poster/result/{generationId}/{jobId}
   Response: { resultUrls, remainingCredits }
   
4. GET /credits/balance
   Response: { balance, isEmpty, canGenerate }
```

---

## 💳 Credit Rules

- 1 credit per generation
- Deducted in STEP 3 (get result), not in STEP 1 (initiate)
- Can't generate without credits
- Returns remaining credits after deduction

---

## 🧪 Test Commands

### Check Credits
```bash
curl -X GET http://localhost:5000/api/v1/generations/credits/balance \
  -H "Authorization: Bearer TOKEN"
```

### Get History
```bash
curl -X GET "http://localhost:5000/api/v1/generations/history?type=poster&limit=10" \
  -H "Authorization: Bearer TOKEN"
```

---

## 📱 JavaScript Example

```javascript
// Initiate
const init = await fetch('/api/v1/generations/poster/initiate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Poster',
    primary_color: '#FF0000'
  })
});
const { generationId, jobId } = (await init.json()).data;

// Wait & Get Result
await new Promise(r => setTimeout(r, 2000));
const res = await fetch(
  `/api/v1/generations/poster/result/${generationId}/${jobId}`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const { resultUrls, remainingCredits } = (await res.json()).data;

console.log('URLs:', resultUrls);
console.log('Credits left:', remainingCredits);
```

---

## 📚 Full Documentation

- **REQUEST_BODY_UPDATE.md** - Before/after comparison
- **EXTERNAL_API_SPEC.md** - Complete specifications
- **QUICK_START_GENERATION.md** - Detailed examples
- **GENERATION_API_GUIDE.md** - Full reference

---

## Status Codes

| Code | Meaning |
|------|---------|
| 201 | Successfully initiated |
| 200 | Result retrieved |
| 400 | Bad request (missing fields) |
| 402 | Insufficient credits |
| 403 | No subscription or unauthorized |
| 404 | Generation not found |
| 500 | Server error |

---

## Tips

✅ Always include `Authorization: Bearer TOKEN` header
✅ Always set `Content-Type: application/json`
✅ Poll result endpoint every 2 seconds (max 30 times)
✅ Check `/credits/balance` before generating
✅ Handle 402 errors gracefully (show upgrade prompt)
✅ Save returned URLs for future reference

---

**Last Updated:** April 7, 2026
**API Version:** 1.0 (Updated)
