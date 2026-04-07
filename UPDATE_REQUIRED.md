# ⚡ API UPDATE - What Changed & What To Do

**Date:** April 7, 2026  
**Status:** BREAKING CHANGES - Update Required  
**Impact:** Frontend code must be updated

---

## 🔴 BREAKING CHANGES

The request body format has changed to match the **exact requirements** from the external Python API.

### Old Format (❌ No Longer Valid)
```json
{ "posterData": { "title": "..." } }
{ "logoData": { "brand_name": "..." } }
```

### New Format (✅ Required Now)
```json
{ "title": "..." }
{ "brand_name": "..." }
```

---

## ✅ What's Been Updated

### Backend Code
- ✅ `src/lib/externalApiService.js` - documentsated with actual fields
- ✅ `src/entities/generation/generation.controller.js` - updated to expect direct fields
- ✅ Request validation - now validates required fields (title for poster, brand_name for logo)

### Documentation
- ✅ `EXTERNAL_API_SPEC.md` - Complete API field specifications
- ✅ `REQUEST_BODY_UPDATE.md` - Before/after comparison
- ✅ `QUICK_REFERENCE.md` - Quick lookup card
- ✅ `FRONTEND_MIGRATION_GUIDE.md` - Step-by-step code updates for all frameworks
- ✅ `generation_api_postman_collection.json` - Updated with new request bodies

---

## 🎯 What You Need To Do

### Step 1: Verify Backend (Already Done ✓)
- Backend has been updated
- `.env` still needs `EXTERNAL_API_BASE_URL=https://poster-ai-1.onrender.com`
- Can restart server

### Step 2: Update Frontend (Action Required ⚠️)
- Update all API calls to use new format
- Remove `posterData` and `logoData` wrappers
- Change field names and formats
- See: `FRONTEND_MIGRATION_GUIDE.md`

### Step 3: Test Updated Endpoints
- Import updated Postman collection
- Create test request with new format
- Verify success response includes URLs and remaining credits

### Step 4: Deploy
- Push updated frontend code
- Monitor for errors
- Test with real users

---

## 📚 Documentation Guide

**What changed?**  
→ Read: `REQUEST_BODY_UPDATE.md`

**What are the new fields?**  
→ Read: `EXTERNAL_API_SPEC.md`

**Show me examples!**  
→ Read: `QUICK_REFERENCE.md`

**How do I update my code?**  
→ Read: `FRONTEND_MIGRATION_GUIDE.md` (for your framework)

**Need quick lookup?**  
→ Read: `QUICK_REFERENCE.md`

---

## 🔧 Poster Generation - New Request

```json
{
  "title": "string (REQUIRED)",
  "subtitle": "string (optional)",
  "description": "string (optional)",
  "brand_name": "string (optional)",
  "primary_color": "#RRGGBB (optional)",
  "secondary_color": "#RRGGBB (optional)",
  "cta": "string (optional)",
  "design_style_prompt": "string (optional)",
  "style_preset": "string (optional)",
  "output_format": "string (optional)",
  "language": "string (optional)",
  "variations": "number (optional)",
  "image": "string or null (optional)"
}
```

---

## 🏢 Logo Generation - New Request

```json
{
  "brand_name": "string (REQUIRED)",
  "tagline": "string (optional)",
  "vision": "string (optional)",
  "industry": "string (optional)",
  "logo_style": "string (optional)",
  "color_palette": "#FF0000,#00FF00 (optional)",
  "language": "string (optional)",
  "reference_image": "string or null (optional)"
}
```

---

## ❌ Common Mistakes to Avoid

### ❌ OLD FORMAT (Don't Use)
```javascript
body: JSON.stringify({
  posterData: { title: 'x' }  // ❌ Wrapper not allowed
})
```

### ✅ CORRECT FORMAT
```javascript
body: JSON.stringify({
  title: 'x'  // ✅ Direct field
})
```

---

### ❌ WRONG COLOR FORMAT
```javascript
primary_color: 'red'           // ❌ Named colors
colors: ['#FF0000']            // ❌ Array format
```

### ✅ CORRECT COLOR FORMAT
```javascript
primary_color: '#FF0000'       // ✅ Hex format
color_palette: '#FF0000,#00FF00'  // ✅ Comma-separated
```

---

## 🧪 Test Your Changes

### 1. Check Backend is Running
```bash
curl -X GET http://localhost:5000/api/v1/generations/credits/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test New Poster Format
```bash
curl -X POST http://localhost:5000/api/v1/generations/poster/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Test Poster" }'
```

### 3. Test New Logo Format
```bash
curl -X POST http://localhost:5000/api/v1/generations/logo/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "brand_name": "TestBrand" }'
```

---

## 📋 Update Checklist

- [ ] Reviewed REQUEST_BODY_UPDATE.md
- [ ] Reviewed EXTERNAL_API_SPEC.md
- [ ] Located all API calls in frontend code (search for `/generations/`)
- [ ] Removed all `posterData` wrappers
- [ ] Removed all `logoData` wrappers
- [ ] Updated all color formats to hex (#RRGGBB)
- [ ] Updated field names to match spec
- [ ] Updated Postman collection (re-import)
- [ ] Tested with cURL
- [ ] Tested in frontend with real token
- [ ] Verified credits deduct correctly
- [ ] Deployed changes

---

## 🆘 Error Messages (If Still Using Old Format)

```json
{
  "success": false,
  "message": "Poster title is required in request body",
  "statusCode": 400
}
```

**This means:** The `posterData` wrapper is still in use. Remove it!

```json
{
  "success": false,
  "message": "Brand name is required in request body",
  "statusCode": 400
}
```

**This means:** The `logoData` wrapper is still in use. Remove it!

---

## 📞 Need Help?

| Question | Answer | File |
|----------|--------|------|
| What fields are required? | title for poster, brand_name for logo | EXTERNAL_API_SPEC.md |
| What's the new format? | Direct fields, no wrapper | REQUEST_BODY_UPDATE.md |
| Show me examples | Check each framework | FRONTEND_MIGRATION_GUIDE.md |
| Quick lookup | See field reference | QUICK_REFERENCE.md |
| What changed from before? | Format, field names, types | REQUEST_BODY_UPDATE.md |

---

## 📊 Files Updated

### Code Files
- [x] `src/lib/externalApiService.js`
- [x] `src/entities/generation/generation.controller.js`
- [x] Values stay in MongoDB unchanged
- [x] Credit logic unchanged
- [x] Authentication unchanged

### Documentation Files
- [x] `EXTERNAL_API_SPEC.md` - NEW
- [x] `REQUEST_BODY_UPDATE.md` - NEW
- [x] `QUICK_REFERENCE.md` - NEW
- [x] `FRONTEND_MIGRATION_GUIDE.md` - NEW
- [x] `generation_api_postman_collection.json` - UPDATED

---

## 🚀 Quick Start

### For JavaScript/React Users
```javascript
// ✅ NEW FORMAT
const response = await fetch('/api/v1/generations/poster/initiate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'My Poster',
    primary_color: '#FF0000',
    variations: 3
  })
});
```

### For Vue.js Users
See: `FRONTEND_MIGRATION_GUIDE.md` → Vue.js section

### For React Hooks
See: `FRONTEND_MIGRATION_GUIDE.md` → React Hook section

### For Form Component
See: `FRONTEND_MIGRATION_GUIDE.md` → Form Component section

---

## ✨ That's It!

1. Update your frontend code (using the migration guide)
2. Test with new format
3. Deploy
4. Monitor

---

## 📅 Timeline

| When | What |
|------|------|
| Now | Update frontend code |
| Next | Test in staging |
| Later | Deploy to production |
| Ongoing | Monitor for errors |

---

## 💡 Pro Tips

1. **All fields are optional except one**
   - Poster: title is required
   - Logo: brand_name is required

2. **Colors must be hex format**
   - ✅ `#FF0000`
   - ❌ `red`
   - ❌ `rgb(255, 0, 0)`

3. **Multiple colors need comma**
   - ✅ `#FF0000,#00FF00,#0000FF`
   - ❌ `#FF0000, #00FF00` (space is ok)
   - ❌ `['#FF0000', '#00FF00']` (not array)

4. **Always include Authorization header**
   - ✅ `Authorization: Bearer TOKEN`
   - ❌ Without Bearer prefix
   - ❌ Without token

5. **Set Content-Type header**
   - ✅ `Content-Type: application/json`
   - ❌ Missing this header

---

**Status:** Ready to Update 🎉

Update your frontend code and test today!
