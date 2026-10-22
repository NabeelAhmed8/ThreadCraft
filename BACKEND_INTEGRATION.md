# ThreadCraft - Backend API Integration Guide

Yeh clothing store mukammal taur par **pure backend integration** ke liye design kiya gaya hai. Isme koi hardcoded mock products ya fake fallback data shamil nahi hai.

---

## 1. Environment Variable Configuration

Apne backend server ka base URL set karne ke liye `my-app/.env.local` file use karein:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
*(Agar aapka backend kisi aur port ya production URL par chal raha ho, jaise `https://api.yourdomain.com`, toh simply is URL ko update kar dein).*

---

## 2. Required Backend API Endpoints

Frontend in 4 primary REST endpoints ko call karta hai:

### A. Get All / Filtered Products
- **Endpoint:** `GET /api/products`
- **Query Parameters (Optional):**
  - `category` (e.g., `men`, `women`, `outerwear`, `casual`)
  - `featured` (`true` ya `false`)
  - `search` (e.g., `linen shirt`, `hoodie`)
  - `sort` (`newest`, `price_asc`, `price_desc`)
  - `limit` (e.g., `8`)
- **Expected JSON Response:**
```json
[
  {
    "id": "1",
    "name": "Oversized Heavyweight Tee",
    "description": "500 GSM ring-spun organic cotton shirt with structured drop shoulders.",
    "price": 45.00,
    "compareAtPrice": 55.00,
    "category": "men",
    "sizes": ["S", "M", "L", "XL"],
    "colors": ["Charcoal", "Bone White", "Washed Olive"],
    "images": [
      "https://example.com/images/tee-front.jpg",
      "https://example.com/images/tee-back.jpg"
    ],
    "inStock": true,
    "featured": true
  }
]
```
*(Frontend dono formats support karta hai: direct array `[...]` ya `{ "products": [...], "total": 10 }`)*

---

### B. Get Single Product by ID
- **Endpoint:** `GET /api/products/:id`
- **Expected JSON Response:**
```json
{
  "id": "1",
  "name": "Oversized Heavyweight Tee",
  "description": "Full product details, fabric composition, wash instructions...",
  "price": 45.00,
  "compareAtPrice": 55.00,
  "category": "men",
  "sizes": ["S", "M", "L", "XL"],
  "colors": ["Charcoal", "Bone White"],
  "images": [
    "https://example.com/images/tee-front.jpg"
  ],
  "inStock": true
}
```

---

### C. Get Categories (Optional)
- **Endpoint:** `GET /api/categories`
- **Expected JSON Response:**
```json
[
  { "id": "1", "name": "Men", "slug": "men" },
  { "id": "2", "name": "Women", "slug": "women" },
  { "id": "3", "name": "Outerwear", "slug": "outerwear" }
]
```

---

### D. Create Order (Checkout)
- **Endpoint:** `POST /api/orders`
- **Request Body:**
```json
{
  "customer": {
    "fullName": "Ahmed Khan",
    "email": "ahmed@example.com",
    "phone": "+92 300 1234567",
    "address": "Street 12, Phase 5",
    "city": "Lahore",
    "postalCode": "54000",
    "country": "Pakistan"
  },
  "items": [
    {
      "id": "1-M-Charcoal",
      "productId": "1",
      "name": "Oversized Heavyweight Tee",
      "price": 45.00,
      "size": "M",
      "color": "Charcoal",
      "quantity": 2
    }
  ],
  "subtotal": 90.00,
  "shipping": 0.00,
  "total": 90.00,
  "paymentMethod": "cod"
}
```
- **Expected Response:**
```json
{
  "success": true,
  "orderId": "TC-849201",
  "message": "Order successfully placed!"
}
```

---

## 3. Shimmer Skeleton & Status Handling
- Data load hone ke doran **Product Skeletons** show hote hain.
- Agar backend band ho ya koi product na mile, toh screen crash nahi hoti balke clean status screen aati hai jo backend connection URL aur Retry button show karti hai.
