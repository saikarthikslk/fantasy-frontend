# Profile Page - Backend API Requirements

This document outlines the API endpoints that need to be implemented in your Spring Boot backend to support the Profile page functionality.

## Overview

The Profile page allows users to:
- View their profile information (email, game name, profile picture)
- Update their game name
- Upload/update their profile picture

## Required API Endpoints

### 1. Get User Profile
**Endpoint:** `GET /api/user/profile`

**Headers:**
- `Authorization: Bearer {JWT_TOKEN}`
- `Content-Type: application/json`

**Response (200 OK):**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "gameName": "PlayerName123",
  "profilePictureUrl": "https://example.com/path/to/picture.jpg",
  "createdAt": "2024-03-28T10:00:00Z",
  "updatedAt": "2024-03-28T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - User not found

---

### 2. Update Game Name
**Endpoint:** `PUT /api/user/gamename`

**Headers:**
- `Authorization: Bearer {JWT_TOKEN}`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "gameName": "NewGameName"
}
```

**Response (200 OK):**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "gameName": "NewGameName",
  "profilePictureUrl": "https://example.com/path/to/picture.jpg",
  "createdAt": "2024-03-28T10:00:00Z",
  "updatedAt": "2024-03-28T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid game name
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - User not found

---

### 3. Upload Profile Picture
**Endpoint:** `POST /api/user/picture`

**Headers:**
- `Authorization: Bearer {JWT_TOKEN}`
- `Content-Type: multipart/form-data`

**Request Body:**
- Form data with file field named `file` (image file: jpg, png, gif, etc.)

**Response (200 OK):**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "gameName": "PlayerName123",
  "profilePictureUrl": "https://example.com/new/picture/url.jpg",
  "createdAt": "2024-03-28T10:00:00Z",
  "updatedAt": "2024-03-28T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid file format or size
- `401 Unauthorized` - Invalid or missing JWT token
- `404 Not Found` - User not found
- `413 Payload Too Large` - File size exceeds limit

---

## Data Model Update

You need to update your User entity to include these fields:

```java
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column
    private String gameName;
    
    @Column(length = 500)
    private String profilePictureUrl;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();
    
    @Column(name = "updated_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedAt = new Date();
    
    // getters and setters
}
```

---

## Implementation Notes

1. **Authentication:** All endpoints require a valid JWT token in the Authorization header
2. **CORS:** Ensure CORS is properly configured to allow requests from your frontend domain
3. **Profile Picture Storage:** 
   - Store images in a file system, cloud storage (S3, GCS), or database
   - Return the URL in `profilePictureUrl`
   - Validate file type and size on the backend
4. **File Size Limit:** Consider implementing a file size limit (e.g., 5MB)
5. **Accepted Formats:** jpg, png, gif, webp
6. **Game Name Validation:** 
   - Min length: 3 characters
   - Max length: 50 characters
   - May contain alphanumeric and special characters

---

## Frontend Integration

The frontend Profile page is located at: `src/pages/Profile.tsx`

API client methods:
- `getUserProfile()` - Fetches user profile
- `updateGameName(gameName: string)` - Updates game name
- `uploadProfilePicture(file: File)` - Uploads profile picture

All methods are in: `src/api/profileApi.ts`

---

## Testing

You can test these endpoints using:
- Postman
- cURL
- Thunder Client (VS Code extension)

Example cURL:
```bash
# Get profile
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8080/api/user/profile

# Update game name
curl -X PUT -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gameName":"NewName"}' \
  http://localhost:8080/api/user/gamename

# Upload picture
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  http://localhost:8080/api/user/picture
```
