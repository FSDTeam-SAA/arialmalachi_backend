# Migration Guide - Update Your Frontend Code

If you already implemented the old format, use this guide to update your code.

---

## JavaScript/React - Poster Generation

### Before (❌ Old Format)

```javascript
// ❌ OLD - Do not use
async function generatePoster(title) {
  const response = await fetch('/api/v1/generations/poster/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      posterData: {                    // ❌ Remove this wrapper
        title: title,
        description: 'My description',
        colors: ['#FF0000', '#0000FF'],  // ❌ Wrong format
        style: 'modern'
      }
    })
  });
  
  const data = await response.json();
  return data;
}
```

### After (✅ New Format)

```javascript
// ✅ NEW - Use this
async function generatePoster(title) {
  const response = await fetch('/api/v1/generations/poster/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({              // ✅ Send fields directly
      title: title,
      subtitle: 'My subtitle',
      description: 'My description',
      brand_name: 'MyBrand',
      primary_color: '#FF0000',         // ✅ Single hex value
      secondary_color: '#0000FF',       // ✅ Separate field
      cta: 'Buy Now',
      design_style_prompt: 'modern',
      style_preset: 'bold',
      output_format: 'png',
      language: 'en',
      variations: 3,
      image: null
    })
  });
  
  const data = await response.json();
  return data;
}
```

---

## JavaScript/React - Logo Generation

### Before (❌ Old Format)

```javascript
// ❌ OLD - Do not use
async function generateLogo(brandName) {
  const response = await fetch('/api/v1/generations/logo/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      logoData: {                       // ❌ Remove this wrapper
        companyName: brandName,
        industry: 'tech',
        colors: ['#0066CC', '#FFFFFF'],   // ❌ Wrong format
        shape: 'circular'
      }
    })
  });
  
  const data = await response.json();
  return data;
}
```

### After (✅ New Format)

```javascript
// ✅ NEW - Use this
async function generateLogo(brandName) {
  const response = await fetch('/api/v1/generations/logo/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({              // ✅ Send fields directly
      brand_name: brandName,
      tagline: 'Our tagline',
      vision: 'Our vision',
      industry: 'technology',
      logo_style: 'modern',
      color_palette: '#0066CC,#38BDF8,#FFFFFF',  // ✅ Comma-separated hex
      language: 'en',
      reference_image: null
    })
  });
  
  const data = await response.json();
  return data;
}
```

---

## React Hook - Complete Workflow

### Before (❌ Old)

```javascript
// ❌ OLD - Do not use
const usePosterGeneration = () => {
  const generatePoster = async (title, description) => {
    // Start generation
    const initRes = await fetch('/api/v1/generations/poster/initiate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        posterData: {  // ❌ Remove wrapper
          title,
          description,
          colors: ['#FF0000'],  // ❌ Wrong format
          style: 'modern'
        }
      })
    });
    
    const initData = await initRes.json();
    const { generationId, jobId } = initData.data;
    
    // Poll for results
    let completed = false;
    let attempts = 0;
    
    while (!completed && attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      
      const resultRes = await fetch(
        `/api/v1/generations/poster/result/${generationId}/${jobId}`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const resultData = await resultRes.json();
      
      if (resultData.success) {
        console.log('URLs:', resultData.data.resultUrls);
        completed = true;
      }
      
      attempts++;
    }
  };
  
  return { generatePoster };
};
```

### After (✅ New)

```javascript
// ✅ NEW - Use this
const usePosterGeneration = () => {
  const generatePoster = async (title, description) => {
    // Start generation
    const initRes = await fetch('/api/v1/generations/poster/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({             // ✅ Send fields directly
        title,
        description,
        primary_color: '#FF0000',        // ✅ Correct format
        style_preset: 'modern',
        variations: 3,
        output_format: 'png'
      })
    });
    
    const initData = await initRes.json();
    
    if (!initData.success) {
      throw new Error(initData.message);
    }
    
    const { generationId, jobId } = initData.data;
    
    // Poll for results
    let attempts = 0;
    
    while (attempts < 30) {
      await new Promise(r => setTimeout(r, 2000));
      
      const resultRes = await fetch(
        `/api/v1/generations/poster/result/${generationId}/${jobId}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const resultData = await resultRes.json();
      
      if (resultData.success) {
        return {
          urls: resultData.data.resultUrls,
          creditsRemaining: resultData.data.remainingCredits
        };
      }
      
      attempts++;
    }
    
    throw new Error('Generation timeout');
  };
  
  return { generatePoster };
};
```

---

## Form Component - Poster

### Before (❌ Old)

```javascript
// ❌ OLD - Do not use
function PosterForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/v1/generations/poster/initiate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        posterData: {  // ❌ Remove wrapper
          title: form.title,
          description: form.description,
          colors: form.colors.split(','),  // ❌ Wrong format
          style: form.style
        }
      })
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Title" />
      <textarea name="description" placeholder="Description" />
      <input name="colors" placeholder="Colors (comma-separated)" />
      <select name="style">
        <option>modern</option>
        <option>classic</option>
      </select>
      <button type="submit">Generate</button>
    </form>
  );
}
```

### After (✅ New)

```javascript
// ✅ NEW - Use this
function PosterForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/v1/generations/poster/initiate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({               // ✅ Send fields directly
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        primary_color: form.primaryColor,  // ✅ Hex format
        secondary_color: form.secondaryColor,
        cta: form.cta,
        style_preset: form.stylePreset,
        design_style_prompt: form.stylePrompt,
        output_format: form.format,
        language: form.language,
        variations: parseInt(form.variations),
        image: form.imageUrl || null
      })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Generation started:', data.data.jobId);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="title"
        placeholder="Title (required)"
        required
      />
      <input
        name="subtitle"
        placeholder="Subtitle"
      />
      <textarea
        name="description"
        placeholder="Description"
      />
      <input
        name="brandName"
        placeholder="Brand Name"
      />
      <input
        name="primaryColor"
        type="color"
        placeholder="Primary Color"
      />
      <input
        name="secondaryColor"
        type="color"
        placeholder="Secondary Color"
      />
      <input
        name="cta"
        placeholder="Call-to-Action"
      />
      <input
        name="stylePrompt"
        placeholder="Design Style"
      />
      <select name="stylePreset">
        <option>modern</option>
        <option>classic</option>
        <option>bold</option>
        <option>elegant</option>
      </select>
      <select name="format">
        <option>png</option>
        <option>jpg</option>
        <option>webp</option>
      </select>
      <select name="language">
        <option>en</option>
        <option>es</option>
        <option>fr</option>
        <option>de</option>
      </select>
      <input
        name="variations"
        type="number"
        min="1"
        max="5"
        placeholder="Number of variations"
      />
      <input
        name="imageUrl"
        type="url"
        placeholder="Reference Image URL"
      />
      <button type="submit">Generate Poster</button>
    </form>
  );
}
```

---

## Vue.js Example

### Before (❌ Old)

```vue
<!-- ❌ OLD - Do not use -->
<template>
  <button @click="generatePoster">Generate</button>
</template>

<script setup>
const generatePoster = async () => {
  const response = await fetch('/api/v1/generations/poster/initiate', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      posterData: {  // ❌ Remove wrapper
        title: 'My Poster',
        colors: ['#FF0000'],  // ❌ Wrong format
        style: 'modern'
      }
    })
  });
};
</script>
```

### After (✅ New)

```vue
<!-- ✅ NEW - Use this -->
<template>
  <button @click="generatePoster">Generate</button>
</template>

<script setup>
const generatePoster = async () => {
  const response = await fetch('/api/v1/generations/poster/initiate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({               // ✅ Send fields directly
      title: 'My Poster',
      primary_color: '#FF0000',          // ✅ Correct format
      style_preset: 'modern',
      variations: 3
    })
  });
  
  const data = await response.json();
  console.log(data);
};
</script>
```

---

## Axios Example

### Before (❌ Old)

```javascript
// ❌ OLD - Do not use
axios.post('/api/v1/generations/poster/initiate', {
  posterData: {  // ❌ Remove wrapper
    title: 'My Poster',
    colors: ['#FF0000']  // ❌ Wrong format
  }
}, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### After (✅ New)

```javascript
// ✅ NEW - Use this
axios.post(
  '/api/v1/generations/poster/initiate',
  {                              // ✅ Send fields directly
    title: 'My Poster',
    primary_color: '#FF0000',    // ✅ Correct format
    variations: 3
  },
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
```

---

## Summary of Changes

| Item | Before | After |
|------|--------|-------|
| Body wrapper | `posterData: {...}` | Direct fields |
| Logo wrapper | `logoData: {...}` | Direct fields |
| Color format | `colors: [...]` array | `#RRGGBB` hex strings |
| Multiple colors | Separate array | `color_palette: "#FF,#00FF"` |
| Field names | `companyName` | `brand_name` |
| Field names | `style` | `style_preset` |

---

## Checklist

- [ ] Remove `posterData` wrapper
- [ ] Remove `logoData` wrapper
- [ ] Change color format to hex (#RRGGBB)
- [ ] Change `colors` to `primary_color` and `secondary_color`
- [ ] Change `color_palette` to comma-separated hex values
- [ ] Update field names (`companyName` → `brand_name`, etc)
- [ ] Test with new Postman collection
- [ ] Test in browser with actual token
- [ ] Verify credits are deducted correctly

---

## Need Help?

- **EXTERNAL_API_SPEC.md** - Field specifications
- **REQUEST_BODY_UPDATE.md** - Before/after comparison
- **QUICK_REFERENCE.md** - Quick lookup
- **QUICK_START_GENERATION.md** - Working examples

---

**Update your code today!** ✨
