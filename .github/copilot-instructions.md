# Copilot Instructions for RecipeBook

## Project Overview
RecipeBook is a Node.js/Express REST API for managing and querying recipes with user authentication. It uses MongoDB for persistent storage with Mongoose as the ODM layer, JWT for authentication, and Winston for structured logging. The server is built with TypeScript and compiled to CommonJS.

## Architecture

### Core Components
- **src/server.ts**: Express server entry point that mounts route handlers
- **src/routes/recipes.ts**: Recipe CRUD operations (GET, POST, PUT, DELETE) mounted at `/recipes`
- **src/routes/users.ts**: User profile and social features mounted at `/user`
- **src/routes/auth.ts**: Authentication endpoints (register, login, /me)
- **src/model/Recipe.ts**: Mongoose schema for Recipe documents
- **src/model/Users.ts**: Mongoose schema for User documents with authentication
- **src/middleware/auth.ts**: JWT authentication middleware
- **src/utils/logger.ts**: Winston logger configuration with file rotation

### Project Structure
```
src/
├── server.ts           # Main Express server
├── middleware/
│   └── auth.ts         # JWT authentication middleware
├── model/
│   ├── Recipe.ts       # Recipe Mongoose schema
│   └── Users.ts        # User Mongoose schema
├── routes/
│   ├── auth.ts         # Authentication routes
│   ├── recipes.ts      # Recipe routes
│   └── users.ts        # User routes
└── utils/
    └── logger.ts       # Winston logger configuration
```

### Data Flow
1. Client sends authenticated or public requests
2. Authentication middleware validates JWT tokens for protected routes
3. Route handlers construct MongoDB queries with filters
4. Mongoose retrieves/modifies documents from MongoDB
5. Logger records all operations with structured metadata
6. Server returns paginated JSON responses

## Key Patterns & Conventions

### Route Organization
Routes are separated by resource type:
- **Authentication routes** (`/register`, `/login`, `/me`) - No prefix
- **Recipe routes** (`/recipes`, `/recipes/:id`, etc.) - Mounted at `/recipes`
- **User routes** (`/user/:username`, `/user/search`, etc.) - Mounted at `/user`

### Authentication Pattern
- JWT tokens issued on registration/login (1-hour expiration)
- Protected routes use `authenticateToken` middleware
- Middleware extracts user ID from token and attaches to `req.user`
- Ownership checks compare `recipe.createdBy.toString()` with `req.user`

### Query Filtering Pattern
Recipe filtering supports multiple strategies:
- **Ingredient filtering**: `?ingredients=salt,pepper&any=false` (AND logic) or `&any=true` (OR logic)
- **Tag filtering**: `?tags=dessert,quick&tagsAny=false` (AND) or `&tagsAny=true` (OR)
- **Text search**: `?search=chocolate` searches title and description with regex
- **Pagination**: `?page=2` with 60 items per page

### MongoDB Filter Operators
- `{ $in: [...] }` - Matches documents where field contains ANY of the values (OR)
- `{ $all: [...] }` - Matches documents where field contains ALL of the values (AND)
- `{ $regex: ..., $options: 'i' }` - Case-insensitive text search

### Pagination Pattern
All list endpoints return paginated responses:
```javascript
{
  recipes: [...],  // or userRecipes, users
  pagination: {
    currentPage: 1,
    totalPages: 5,
    hasPreviousPage: false,
    totalRecipes: 287,
    hasNextPage: true
  }
}
```

### Logging Pattern
Uses Winston with structured logging:
- **Development**: Colorized console output
- **Production**: JSON logs in `logs/combined.log` and `logs/error.log`
- **Log rotation**: 5MB per file, max 5 files
- Log all requests, errors, and important operations with metadata

Example:
```javascript
logger.info('Recipe created successfully', {
  recipeId: newRecipe._id.toString(),
  title,
  createdBy,
});
```

### TypeScript Setup
- Strict mode enabled
- CommonJS module format with Node module resolution
- Target: ES2020
- Compiled to `./dist` directory from `./src` source

### Environment Configuration
Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 3000)
- `LOG_LEVEL`: Logging level (default: 'info')

## API Endpoints

### Authentication
- `POST /register` - Create new user account
- `POST /login` - Authenticate and get JWT token
- `GET /me` - Get current user profile (protected)

### Recipes
- `GET /recipes` - List/filter recipes with pagination
- `GET /recipes/:id` - Get single recipe by ID
- `POST /recipes` - Create recipe (protected)
- `PUT /recipes/:id` - Update recipe (protected, owner only)
- `DELETE /recipes/:id` - Delete recipe (protected, owner only)
- `POST /recipes/:id/save` - Toggle save recipe (protected)

### Users
- `GET /user/:username` - Get user profile and their recipes
- `GET /user/search?q=` - Search users by username
- `POST /user/:userid/follow` - Toggle follow user (protected)

## Build & Runtime

### Development
```bash
npm run dev  # Runs nodemon for auto-reload with ts-node
```

### Production Build & Run
```bash
npm run build  # Compiles TypeScript to dist/
npm start      # Runs compiled dist/server.js
```

### Testing
```bash
npx ts-node test.ts  # Run comprehensive API test suite (23 tests)
```

## Important Implementation Details

### Case Normalization
Ingredients and tags are converted to lowercase during filtering for case-insensitive matching.

### ObjectId Comparison
Always use `.toString()` when comparing MongoDB ObjectIds with strings:
```javascript
if (recipe.createdBy.toString() !== userId) { ... }
```

### Error Handling
- All endpoints wrapped in try-catch
- MongoDB errors logged with Winston
- Appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Structured error responses: `{ error: "message" }`

### Security
- Passwords hashed with bcrypt before storage
- JWT tokens expire after 1 hour
- Email and username uniqueness enforced
- Ownership checks on update/delete operations
- User emails excluded from public profile responses

### Performance Optimizations
- Instructions field excluded from list views (`.select('-instructions')`)
- Population limited to necessary fields (`.populate('createdBy', 'username')`)
- Pagination prevents large result sets

## When Adding Features
- Separate routes by resource type (create new route files if needed)
- Use Winston logger for all operations
- Implement proper authentication checks
- Add pagination for list endpoints
- Update test.ts with new test cases
- Document in README.md
- Follow existing TypeScript patterns
- Use `.toString()` for ObjectId comparisons
