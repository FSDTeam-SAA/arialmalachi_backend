# ⚡ CRITICAL UPDATE - Request Body Format Changed

## What Changed?

The request body format has been updated to match the **exact requirements** from the external Python API.

### BEFORE (❌ Old Format - No Longer Valid)
```json
{
  "posterData": {
    "title": "My Poster"
  }
}
```

```json
{
  "logoData": {
    "brand_name": "MyBrand"
  }
}
```

### AFTER (✅ New Format - Required)
```json
{
  "title": "My Poster"
}
```

```json
{
  "brand_name": "MyBrand"
}
```

---

## Why Changed?

The external API expects the fields **directly in the request body**, not wrapped. The backend now matches the external API specification exactly.

---

## Affected Endpoints

### Poster Generation
- **Endpoint:** `POST /api/v1/generations/poster/initiate`
- **Old Body:** `{ "posterData": {...} }`
- **New Body:** Send fields directly (see below)

### Logo Generation
- **Endpoint:** `POST /api/v1/generations/logo/initiate`
- **Old Body:** `{ "logoData": {...} }`
- **New Body:** Send fields directly (see below)

---

## New Request Formats

### Poster - Complete Example

```json
{
  "title": "Summer Sale",
  "subtitle": "Limited Time",
  "description": "Shop now and save",
  "brand_name": "ShopHub",
  "primary_color": "#FF6B9D",
  "secondary_color": "#FFA502",
  "cta": "Buy Now",
  "design_style_prompt": "vibrant and modern",
  "style_preset": "bold",
  "output_format": "png",
  "language": "en",
  "variations": 3,
  "image": null
}
```

**Required Fields:**
- ✓ `title` - Poster headline (REQUIRED)

**Optional Fields:**
- `subtitle`
- `description`
- `brand_name`
- `primary_color` - Hex format (#RRGGBB)
- `secondary_color` - Hex format (#RRGGBB)
- `cta` - Call-to-action text
- `design_style_prompt`
- `style_preset`
- `output_format`
- `language`
- `variations` - Number 1-5
- `image` - Image URL or null

---

### Logo - Complete Example

```json
{
  "brand_name": "TechCorp",
  "tagline": "Innovate Today",
  "vision": "Leading the future",
  "industry": "technology",
  "logo_style": "modern",
  "color_palette": "#0066CC,#38BDF8,#FFFFFF",
  "language": "en",
  "reference_image": null
}
```

**Required Fields:**
- ✓ `brand_name` - Company name (REQUIRED)

**Optional Fields:**
- `tagline`
- `vision`
- `industry`
- `logo_style`
- `color_palette` - Comma-separated hex values
- `language`
- `reference_image` - Image URL or null

---

## How to Update Your Code

### If Using JavaScript/Frontend

**❌ BEFORE:**
```javascript
const response = await fetch('/api/v1/generations/poster/initiate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    posterData: {  // ❌ Remove this wrapper
      title: 'My Poster',
      subtitle: 'Subtitle'
    }
  })
});
```

**✅ AFTER:**
```javascript
const response = await fetch('/api/v1/generations/poster/initiate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    title: 'My Poster',      // ✅ Direct fields
    subtitle: 'Subtitle'
  })
});
```

---

### If Using Postman

**❌ BEFORE:**
```json
{
  "posterData": {
    "title": "My Poster"
  }
}
```

**✅ AFTER:**
```json
{
  "title": "My Poster"
}
```

Just remove the `posterData` or `logoData` wrapper!

---

### If Using cURL

**❌ BEFORE:**
```bash
curl -X POST http://localhost:5000/api/v1/generations/poster/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "posterData": {
      "title": "My Poster"
    }
  }'
```

**✅ AFTER:**
```bash
curl -X POST http://localhost:5000/api/v1/generations/poster/initiate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Poster"
  }'
```

---

## Testing Updated Endpoints

### Copy-Paste Ready Examples

**Poster with All Fields:**
```bash
curl -X POST http://localhost:5000/api/v1/generations/poster/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Black Friday Sale",
    "subtitle": "Biggest Deals",
    "description": "Limited time offers",
    "brand_name": "ShopHub",
    "primary_color": "#FF0000",
    "secondary_color": "#000000",
    "cta": "Shop Now",
    "design_style_prompt": "festive and bold",
    "style_preset": "bold",
    "output_format": "png",
    "language": "en",
    "variations": 3,
    "image": null
  }'
```

**Logo with All Fields:**
```bash
curl -X POST http://localhost:5000/api/v1/generations/logo/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "TechNova",
    "tagline": "Innovation at Scale",
    "vision": "Leading technology solutions",
    "industry": "technology",
    "logo_style": "modern",
    "color_palette": "#0066CC,#38BDF8,#FFFFFF",
    "language": "en",
    "reference_image": null
  }'
```

**Minimal Poster (Required Fields Only):**
```bash
curl -X POST http://localhost:5000/api/v1/generations/poster/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Sale"
  }'
```

**Minimal Logo (Required Fields Only):**
```bash
curl -X POST http://localhost:5000/api/v1/generations/logo/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "MyBrand"
  }'
```

---

## Updated Postman Collection

The file `generation_api_postman_collection.json` has been updated with the new request format.

**To reimport:**
1. Delete old collection
2. Import updated `generation_api_postman_collection.json`
3. Set variables: `base_url` and `token`
4. Use the updated request bodies

---

## Error Messages (If Using Old Format)

If you try to use the old format, you'll get:

```json
{
  "success": false,
  "message": "Poster title is required in request body",
  "statusCode": 400
}
```

or

```json
{
  "success": false,
  "message": "Brand name is required in request body",
  "statusCode": 400
}
```

This means the fields weren't found at the top level - you're probably still using the old wrapped format.

---

## Field Reference

### Poster Fields
| Field | Type | Required | Example |
|-------|------|----------|---------|
| title | string | ✓ Yes | "Summer Sale" |
| subtitle | string | ✗ No | "Limited Time" |
| description | string | ✗ No | "Shop now and save" |
| brand_name | string | ✗ No | "MyBrand" |
| primary_color | string | ✗ No | "#FF0000" |
| secondary_color | string | ✗ No | "#0000FF" |
| cta | string | ✗ No | "Buy Now" |
| design_style_prompt | string | ✗ No | "modern and vibrant" |
| style_preset | string | ✗ No | "bold" |
| output_format | string | ✗ No | "png" |
| language | string | ✗ No | "en" |
| variations | number | ✗ No | 3 |
| image | string | ✗ No | null or URL |

### Logo Fields
| Field | Type | Required | Example |
|-------|------|----------|---------|
| brand_name | string | ✓ Yes | "TechCorp" |
| tagline | string | ✗ No | "Innovate" |
| vision | string | ✗ No | "Leading tech" |
| industry | string | ✗ No | "technology" |
| logo_style | string | ✗ No | "modern" |
| color_palette | string | ✗ No | "#FF0000,#00FF00" |
| language | string | ✗ No | "en" |
| reference_image | string | ✗ No | null or URL |

---

## What Stays the Same?

✅ **Getting Results** - No change:
```
POST /api/v1/generations/poster/result/{generationId}/{jobId}
POST /api/v1/generations/logo/result/{generationId}/{jobId}
```

✅ **Credit Balance** - No change:
```
GET /api/v1/generations/credits/balance
```

✅ **History** - No change:
```
GET /api/v1/generations/history
```

✅ **Authentication** - No change:
- Still requires `Authorization: Bearer TOKEN`

✅ **Credit Deduction** - No change:
- Still 1 credit per generation
- Still deducted when result is retrieved
- Still blocked if no credits

---

## Complete Documentation

For full details, see:
- **EXTERNAL_API_SPEC.md** - Complete API specification
- **QUICK_START_GENERATION.md** - Quick examples
- **GENERATION_API_GUIDE.md** - Full API guide

---

## Summary

| Item | Before | After |
|------|--------|-------|
| Poster endpoint | `/poster/initiate` | `/poster/initiate` |
| Poster body | `{posterData: {...}}` | `{...}` |
| Logo endpoint | `/logo/initiate` | `/logo/initiate` |
| Logo body | `{logoData: {...}}` | `{...}` |
| Result endpoint | Same | Same |
| Credit deduction | Same | Same |
| Authentication | Same | Same |

---

**Update your code today to match the new format!** ✨
