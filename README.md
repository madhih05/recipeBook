# RecipeBook API

A Node.js/Express REST API for managing and querying recipes with user authentication. Built with TypeScript, MongoDB, and Mongoose.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Recipes](#recipes)
  - [Users](#users)
- [Testing](#testing)
- [Examples](#examples)

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the project root with the following variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/recipebook?retryWrites=true&w=majority&appName=RecipeBook
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

## Running the Server

### Development (with auto-reload)

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

---

## API Endpoints

### Authentication

#### POST /register

Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Email already in use"
}
```

**Validation:**
- Email and username must be unique
- Password must be at least 6 characters
- Username must be at least 3 characters

---

#### POST /login

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "username": "johndoe",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid email or password"
}
```

**Note:**
- JWT tokens expire after 1 hour
- Include token in Authorization header: `Authorization: Bearer <token>`

---

#### GET /me

Get the current authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2024-01-04T10:30:00Z",
    "savedRecipes": []
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

---

### Recipes

#### GET /recipes

Retrieve all recipes with optional filtering by ingredients, tags, or creator.

**Query Parameters:**
- `ingredients` (string): Comma-separated ingredient names (e.g., `salt,pepper`)
- `any` (boolean): Use OR logic for ingredients (default: `false` for AND logic)
- `tags` (string): Comma-separated tag names (e.g., `dessert,quick`)
- `tagsAny` (boolean): Use OR logic for tags (default: `false` for AND logic)
- `createdBy` (string): Filter by recipe creator's username

**Examples:**

Get all recipes:
```
GET /recipes
```

Get recipes with ALL specified ingredients:
```
GET /recipes?ingredients=salt,pepper&any=false
```

Get recipes with ANY of the ingredients:
```
GET /recipes?ingredients=salt,sugar&any=true
```

Get recipes with specific tags:
```
GET /recipes?tags=dessert,quick&tagsAny=false
```

Get recipes by specific user:
```
GET /recipes?createdBy=johndoe
```

Combine filters:
```
GET /recipes?ingredients=salt&tags=dessert&createdBy=johndoe
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Chocolate Cake",
    "description": "A delicious homemade chocolate cake",
    "ingredients": ["flour", "sugar", "cocoa", "butter", "eggs"],
    "tags": ["dessert", "baking"],
    "instructions": "Mix dry ingredients, combine with wet ingredients, bake at 350°F for 30 minutes",
    "createdBy": "johndoe",
    "createdAt": "2024-01-04T10:35:00Z",
    "updatedAt": "2024-01-04T10:35:00Z"
  }
]
```

---

#### POST /recipes

Create a new recipe (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Chocolate Cake",
  "description": "A delicious homemade chocolate cake",
  "ingredients": ["flour", "sugar", "cocoa", "butter", "eggs"],
  "tags": ["dessert", "baking"],
  "instructions": "Mix dry ingredients, combine with wet ingredients, bake at 350°F for 30 minutes"
}
```

**Response (201 Created):**
```json
{
  "message": "Recipe created successfully",
  "recipe": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Chocolate Cake",
    "description": "A delicious homemade chocolate cake",
    "ingredients": ["flour", "sugar", "cocoa", "butter", "eggs"],
    "tags": ["dessert", "baking"],
    "instructions": "Mix dry ingredients, combine with wet ingredients, bake at 350°F for 30 minutes",
    "createdBy": "johndoe",
    "createdAt": "2024-01-04T10:35:00Z",
    "updatedAt": "2024-01-04T10:35:00Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Validation:**
- Title, description, ingredients, and instructions are required
- Tags are optional

---

#### GET /recipes/:id

Retrieve a single recipe by its MongoDB ObjectId.

**Example:**
```
GET /recipes/507f1f77bcf86cd799439012
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Chocolate Cake",
  "description": "A delicious homemade chocolate cake",
  "ingredients": ["flour", "sugar", "cocoa", "butter", "eggs"],
  "tags": ["dessert", "baking"],
  "instructions": "Mix dry ingredients, combine with wet ingredients, bake at 350°F for 30 minutes",
  "createdBy": "johndoe",
  "createdAt": "2024-01-04T10:35:00Z",
  "updatedAt": "2024-01-04T10:35:00Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Recipe not found"
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "error": "Cast to ObjectId failed for value \"invalid-id\""
}
```

---

#### DELETE /recipes/:id

Delete a recipe (requires authentication and ownership).

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
DELETE /recipes/507f1f77bcf86cd799439012
```

**Response (200 OK):**
```json
{
  "message": "Recipe deleted successfully"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Error Response (403 Forbidden):**
```json
{
  "error": "Forbidden: You can only delete your own recipes"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Recipe not found"
}
```

---

### Users

#### GET /user/:username

Retrieve a user's profile and all recipes they created.

**Example:**
```
GET /user/johndoe
```

**Response (200 OK):**
```json
{
  "userInfo": {
    "_id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "savedRecipes": [],
    "createdAt": "2024-01-04T10:30:00Z"
  },
  "userRecipes": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Chocolate Cake",
      "description": "A delicious homemade chocolate cake",
      "ingredients": ["flour", "sugar", "cocoa", "butter", "eggs"],
      "tags": ["dessert", "baking"],
      "instructions": "Mix dry ingredients, combine with wet ingredients, bake at 350°F for 30 minutes",
      "createdBy": "johndoe",
      "createdAt": "2024-01-04T10:35:00Z",
      "updatedAt": "2024-01-04T10:35:00Z"
    }
  ]
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

**Note:**
- User email is excluded from the response for privacy
- Returns only the public profile information

---

## Testing

Run the comprehensive test suite:

```bash
npx ts-node test.ts
```

Make sure the server is running before running tests. The test suite will:
- Register a new test user
- Test login and authentication
- Create a test recipe
- Test all filtering and retrieval endpoints
- Test user profile retrieval
- Test recipe deletion
- Display a detailed test report

**Test Output Example:**
```
📊 Test Results:

┌─────────────────────────────────────────────────────┬────────┐
│ Test Name                                           │ Status │
├─────────────────────────────────────────────────────┼────────┤
│ POST /register - Success                            │ ✅ PASS │
│ POST /register - Duplicate email rejected           │ ✅ PASS │
│ POST /login - Success                               │ ✅ PASS │
│ POST /login - Wrong password rejected               │ ✅ PASS │
│ GET /me - Success                                   │ ✅ PASS │
│ GET /me - Unauthorized                              │ ✅ PASS │
│ POST /recipes - Create recipe                       │ ✅ PASS │
│ GET /recipes - Get all recipes                      │ ✅ PASS │
│ GET /recipes - Filter by ingredients (AND)          │ ✅ PASS │
│ GET /recipes - Filter by ingredients (OR)           │ ✅ PASS │
│ GET /recipes - Filter by tags                       │ ✅ PASS │
│ GET /recipes - Filter by creator                    │ ✅ PASS │
│ GET /recipes/:id - Get recipe by ID                 │ ✅ PASS │
│ GET /recipes/:id - Invalid ID                       │ ✅ PASS │
│ GET /user/:username - Get user profile              │ ✅ PASS │
│ GET /user/:username - User not found                │ ✅ PASS │
│ DELETE /recipes/:id - Unauthorized                  │ ✅ PASS │
│ DELETE /recipes/:id - Authorized                    │ ✅ PASS │
├─────────────────────────────────────────────────────┼────────┤
│ Total: 18 tests | Passed: 18 | Failed: 0            │        │
└─────────────────────────────────────────────────────┴────────┘
```

---

## Examples

### Example 1: Register and Create a Recipe

```bash
# 1. Register a user
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "chefmary",
    "email": "mary@example.com",
    "password": "password123"
  }'

# Response includes token

# 2. Create a recipe with the token
curl -X POST http://localhost:3000/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Pasta Carbonara",
    "description": "Classic Italian pasta dish",
    "ingredients": ["pasta", "eggs", "bacon", "parmesan"],
    "tags": ["italian", "dinner"],
    "instructions": "Cook pasta, fry bacon, mix with eggs and cheese"
  }'
```

### Example 2: Search Recipes

```bash
# Find recipes with ALL specified ingredients
curl "http://localhost:3000/recipes?ingredients=salt,pepper&any=false"

# Find recipes with ANY of the ingredients
curl "http://localhost:3000/recipes?ingredients=salt,sugar&any=true"

# Find recipes with specific tags
curl "http://localhost:3000/recipes?tags=dessert&tagsAny=false"

# Find recipes by a specific user
curl "http://localhost:3000/recipes?createdBy=chefmary"

# Combine multiple filters
curl "http://localhost:3000/recipes?ingredients=flour&tags=baking&createdBy=chefmary"
```

### Example 3: Get User Profile

```bash
# Get user profile and their recipes
curl "http://localhost:3000/user/chefmary"
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200 OK**: Successful GET request
- **201 Created**: Successful resource creation
- **400 Bad Request**: Invalid input or duplicate record
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Authorized but lacks permission (e.g., deleting another user's recipe)
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

---

## Security Notes

- Passwords are hashed using bcrypt before storage
- JWT tokens expire after 1 hour
- Always use HTTPS in production
- Store `JWT_SECRET` securely and never commit it to version control
- Sensitive user information (email, password) is never returned in API responses
