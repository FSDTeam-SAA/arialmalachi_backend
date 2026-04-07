# External API Request Body Specification

This document specifies the exact request body formats expected by the external Python APIs at `https://poster-ai-1.onrender.com`.

---

## 🎨 Poster Generation API

### Endpoint: `POST /generate-poster-complete`

**Purpose:** Generate poster images from specifications

**Request Body (JSON):**

```json
{
  "title": "string",                    // Required: Poster title
  "subtitle": "string",                 // Optional: Poster subtitle
  "description": "string",              // Optional: Detailed description
  "brand_name": "string",               // Optional: Brand/company name
  "primary_color": "string",            // Optional: Primary color (hex #RRGGBB)
  "secondary_color": "string",          // Optional: Secondary color (hex #RRGGBB)
  "cta": "string",                      // Optional: Call-to-action text
  "design_style_prompt": "string",      // Optional: Style description (modern, vintage, minimalist, etc)
  "style_preset": "string",             // Optional: Predefined style (professional, casual, bold, elegant)
  "output_format": "string",            // Optional: Format (png, jpg, webp)
  "language": "string",                 // Optional: Language code (en, es, fr, de, etc)
  "variations": "number",               // Optional: Number of variations to generate (1-5)
  "image": "string | null"              // Optional: Reference image URL or base64 encoded
}
```

**Example Request:**

```json
{
  "title": "Summer Sale 2024",
  "subtitle": "Get Up to 50% Off",
  "description": "Shop our summer collection with incredible discounts",
  "brand_name": "FashionCo",
  "primary_color": "#FF6B9D",
  "secondary_color": "#FFA502",
  "cta": "Shop Now",
  "design_style_prompt": "vibrant and energetic with tropical vibes",
  "style_preset": "bold",
  "output_format": "png",
  "language": "en",
  "variations": 3,
  "image": null
}
```

**Response:**

```json
{
  "job_id": "job_1234567890",
  "status": "processing"
}
```

**Result URL Pattern:** `POST /generate_poster_/result/{job_id}`

---

## 🏢 Logo Generation API

### Endpoint: `POST /generate-logo`

**Purpose:** Generate logo images from brand specifications

**Request Body (JSON):**

```json
{
  "brand_name": "string",               // Required: Company/brand name
  "tagline": "string",                  // Optional: Brand tagline/motto
  "vision": "string",                   // Optional: Brand vision statement
  "industry": "string",                 // Optional: Industry (tech, fashion, food, finance, etc)
  "logo_style": "string",               // Optional: Style (modern, classic, minimalist, playful, abstract, geometric)
  "color_palette": "string",            // Optional: Comma-separated hex colors (#FF0000,#00FF00,#0000FF)
  "language": "string",                 // Optional: Language code (en, es, fr, de, etc)
  "reference_image": "string"           // Optional: Reference image URL or base64 encoded
}
```

**Example Request:**

```json
{
  "brand_name": "TechNova",
  "tagline": "Innovation at Scale",
  "vision": "Empowering businesses through AI and automation",
  "industry": "technology",
  "logo_style": "modern",
  "color_palette": "#0066CC,#FFFFFF,#38BDF8",
  "language": "en",
  "reference_image": null
}
```

**Response:**

```json
{
  "job_id": "job_0987654321",
  "status": "processing"
}
```

**Result URL Pattern:** `POST /generate_logo/result/{job_id}`

---

## 🤖 AI Generate Poster Fields API

### Endpoint: `POST /ai-generate-poster-fields`

**Purpose:** Use AI to suggest poster fields based on a prompt

**Request Body (JSON):**

```json
{
  "prompt": "string",                   // Required: Description of desired poster
  "tone": "string",                     // Optional: Tone (professional, casual, fun, serious, elegant)
  "additionalContext": "string"         // Optional: Additional context for generation
}
```

**Example Request:**

```json
{
  "prompt": "Create a poster for a tech startup conference",
  "tone": "professional and innovative",
  "additionalContext": "Focus on technology, innovation, and networking. Modern design."
}
```

**Response:**

```json
{
  "title": "Tech Conference 2024",
  "subtitle": "Connect. Innovate. Transform.",
  "description": "Join leading innovators and tech experts for a transformative experience",
  "design_style_prompt": "modern, sleek, minimalist with vibrant accents",
  "style_preset": "bold",
  "primary_color": "#0066CC",
  "secondary_color": "#38BDF8",
  "cta": "Register Now",
  "variations": 2
}
```

---

## Your Backend Endpoints (Updated)

### Changed: Direct Body Format

Your backend now accepts the exact format from the external API.

---

### Poster Generation - Updated

```bash
POST /api/v1/generations/poster/initiate
```

**Request Body (send data directly, not wrapped):**

```json
{
  "title": "Summer Sale",
  "subtitle": "Limited Time",
  "description": "Shop now",
  "brand_name": "MyBrand",
  "primary_color": "#FF0000",
  "secondary_color": "#0000FF",
  "cta": "Buy Now",
  "design_style_prompt": "modern and vibrant",
  "style_preset": "bold",
  "output_format": "png",
  "language": "en",
  "variations": 3,
  "image": null
}
```

**Before (OLD - No Longer Valid):**
```json
{
  "posterData": { ... }  // ❌ This wrapper is no longer needed
}
```

---

### Logo Generation - Updated

```bash
POST /api/v1/generations/logo/initiate
```

**Request Body (send data directly, not wrapped):**

```json
{
  "brand_name": "TechCorp",
  "tagline": "Innovate",
  "vision": "Leading technology",
  "industry": "technology",
  "logo_style": "modern",
  "color_palette": "#0066CC,#FFFFFF",
  "language": "en",
  "reference_image": null
}
```

**Before (OLD - No Longer Valid):**
```json
{
  "logoData": { ... }  // ❌ This wrapper is no longer needed
}
```

---

## 📝 Get Result Endpoints (No Changes)

These remain the same:

```bash
POST /api/v1/generations/poster/result/:generationId/:jobId
POST /api/v1/generations/logo/result/:generationId/:jobId
```

---

## 🔧 Field Types & Validations

### Poster Fields

| Field | Type | Required | Format | Notes |
|-------|------|----------|--------|-------|
| title | string | ✓ Yes | Any | Main poster headline |
| subtitle | string | ✗ No | Any | Secondary text |
| description | string | ✗ No | Any | Detailed content |
| brand_name | string | ✗ No | Any | Company/brand name |
| primary_color | string | ✗ No | hex (#RRGGBB) | Must be valid hex |
| secondary_color | string | ✗ No | hex (#RRGGBB) | Must be valid hex |
| cta | string | ✗ No | Any | Call-to-action button text |
| design_style_prompt | string | ✗ No | Any | Design description |
| style_preset | string | ✗ No | Enum | modern, classic, minimalist, etc |
| output_format | string | ✗ No | Enum | png, jpg, webp |
| language | string | ✗ No | ISO 639-1 | en, es, fr, de, etc |
| variations | number | ✗ No | 1-5 | Number of variants |
| image | string | ✗ No | URL or base64 | Reference image |

### Logo Fields

| Field | Type | Required | Format | Notes |
|-------|------|----------|--------|-------|
| brand_name | string | ✓ Yes | Any | Company name |
| tagline | string | ✗ No | Any | Brand motto |
| vision | string | ✗ No | Any | Brand vision |
| industry | string | ✗ No | Any | Industry type |
| logo_style | string | ✗ No | Enum | modern, classic, minimalist, etc |
| color_palette | string | ✗ No | CSV hex | #FF0000,#00FF00,#0000FF |
| language | string | ✗ No | ISO 639-1 | en, es, fr, de, etc |
| reference_image | string | ✗ No | URL or base64 | Reference image |

---

## 💡 Usage Examples

### cURL - Poster

```bash
curl -X POST http://localhost:5000/api/v1/generations/poster/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Black Friday Sale",
    "subtitle": "Biggest Deals of the Year",
    "description": "Don'\''t miss out on amazing discounts",
    "brand_name": "ShopHub",
    "primary_color": "#FF0000",
    "secondary_color": "#000000",
    "cta": "Shop Now",
    "design_style_prompt": "festive and energetic",
    "style_preset": "bold",
    "output_format": "png",
    "language": "en",
    "variations": 3,
    "image": null
  }'
```

### cURL - Logo

```bash
curl -X POST http://localhost:5000/api/v1/generations/logo/initiate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand_name": "DesignStudio",
    "tagline": "Creative Solutions",
    "vision": "Transforming ideas into reality",
    "industry": "design",
    "logo_style": "modern",
    "color_palette": "#FF6B9D,#FFA502,#FFFFFF",
    "language": "en",
    "reference_image": null
  }'
```

### JavaScript - Poster

```javascript
const generatePoster = async (title) => {
  const response = await fetch('/api/v1/generations/poster/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: title,                          // Required
      subtitle: 'Limited Time Offer',
      description: 'Amazing deals available',
      brand_name: 'MyBrand',
      primary_color: '#FF6B9D',
      secondary_color: '#FFA502',
      cta: 'Shop Now',
      design_style_prompt: 'vibrant and modern',
      style_preset: 'bold',
      output_format: 'png',
      language: 'en',
      variations: 3,
      image: null
    })
  });
  
  const data = await response.json();
  return data;
};
```

### JavaScript - Logo

```javascript
const generateLogo = async (brandName) => {
  const response = await fetch('/api/v1/generations/logo/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      brand_name: brandName,                 // Required
      tagline: 'Your tagline here',
      vision: 'Our brand vision',
      industry: 'technology',
      logo_style: 'modern',
      color_palette: '#0066CC,#38BDF8,#FFFFFF',
      language: 'en',
      reference_image: null
    })
  });
  
  const data = await response.json();
  return data;
};
```

---

## 🚀 Migration Guide (If Using Old Format)

### Old Way (❌ No Longer Valid)
```json
{
  "posterData": {
    "title": "Sale"
  }
}
```

### New Way (✅ Correct)
```json
{
  "title": "Sale"
}
```

---

## Common Mistakes

❌ **WRONG:**
```json
{
  "posterData": {
    "title": "My Poster"
  }
}
```

✅ **CORRECT:**
```json
{
  "title": "My Poster"
}
```

---

❌ **WRONG:**
```json
{
  "logoData": {
    "brand_name": "MyBrand"
  }
}
```

✅ **CORRECT:**
```json
{
  "brand_name": "MyBrand"
}
```

---

## Response Format

All responses from your backend follow this format:

**Success (Initiate):**
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

**Success (Get Result):**
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
    "remainingCredits": 49
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Poster title is required in request body",
  "statusCode": 400
}
```

---

## ✅ Quick Checklist for Frontend

- [ ] Send `title` directly in body (not wrapped in `posterData`)
- [ ] Send `brand_name` directly in body (not wrapped in `logoData`)
- [ ] Use `#` format for hex colors: `#FF0000`
- [ ] Separate multiple colors with commas: `#FF0000,#00FF00`
- [ ] Include `Authorization: Bearer TOKEN` header
- [ ] Set `Content-Type: application/json`
- [ ] All required fields must be included
- [ ] Optional fields can be `null` or omitted entirely

---

## Support

For API questions, check the external API documentation:
https://poster-ai-1.onrender.com/docs

For backend integration questions, see:
- QUICK_START_GENERATION.md
- GENERATION_API_GUIDE.md
