
# Plan: Update Favicon

## Overview
Add your uploaded favicon image to the project and configure it in `index.html` so it displays on your published site and custom domain.

## Steps

### 1. Copy the Favicon to the Public Folder
Copy the uploaded image from `user-uploads://Favicon.png` to `public/favicon.png`.

### 2. Update `index.html`
Add a favicon link tag in the `<head>` section:
```html
<link rel="icon" href="/favicon.png" type="image/png">
```

## Result
After publishing, your favicon will appear:
- On the preview URL
- On your published Lovable URL (chat-whisperer-gen.lovable.app)
- On any custom domain you've connected

## Technical Note
The favicon will be a PNG format icon showing "im" text as in your uploaded image.
