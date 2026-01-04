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
- [Logging](#logging)
- [Error Handling](#error-handling)
- [Security Notes](#security-notes)

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
LOG_LEVEL=info
```

**Configuration Options:**
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (default: 3000)
- `LOG_LEVEL`: Logging level - `error`, `warn`, `info`, `debug` (default: `info`)

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

## Logging

The application uses [Winston](https://github.com/winstonjs/winston) for comprehensive logging of all endpoints and important actions.

### Log Outputs

Logs are recorded in two formats:

1. **Console Output**: Colored, human-readable logs displayed in the terminal during development
2. **File Output**: JSON-formatted logs stored in the `logs/` directory
   - `logs/combined.log`: All logs (info, warn, error)
   - `logs/error.log`: Error-level logs only

### Log Rotation

Log files automatically rotate when they reach:
- **Max file size**: 5MB
- **Max files kept**: 5 (oldest files are automatically deleted)

### Logged Events

The application logs the following events:

**Server & Database:**
- MongoDB connection success/failure
- Server startup information

**Authentication:**
- User registration attempts (success/failure)
- Login attempts (success/failure)
- Token authentication (success/failure)
- Unauthorized access attempts

**Recipe Operations:**
- Recipe queries with filter parameters
- Recipe creation with details
- Recipe retrieval by ID
- Recipe deletion attempts
- Authorization failures

**User Operations:**
- User profile fetches
- User not found errors

### Log Levels

Configure the log level via the `LOG_LEVEL` environment variable:

```bash
LOG_LEVEL=debug  # Shows all logs
LOG_LEVEL=info   # Default - shows info, warn, error
LOG_LEVEL=warn   # Shows only warnings and errors
LOG_LEVEL=error  # Shows only errors
```

### Log Format

**Console (Development):**
```
2026-01-04 10:30:45 [info]: User registered successfully {"userId":"507f1f77bcf86cd799439011","username":"johndoe","email":"john@example.com"}
```

**File (JSON):**
```json
{
  "timestamp": "2026-01-04 10:30:45",
  "level": "info",
  "message": "User registered successfully",
  "userId": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "email": "john@example.com"
}
```

### Viewing Logs

**Real-time console logs:**
```bash
npm run dev
```

**View combined logs:**
```bash
cat logs/combined.log
```

**View error logs only:**
```bash
cat logs/error.log
```

**Tail logs in real-time:**
```bash
tail -f logs/combined.log
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
