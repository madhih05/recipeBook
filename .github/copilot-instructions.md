# Copilot Instructions for RecipeBook

## Project Overview
RecipeBook is a Node.js/Express REST API for managing and querying recipes. It uses MongoDB for persistent storage with Mongoose as the ODM layer. The server is built with TypeScript and compiled to CommonJS.

## Architecture

### Core Components
- **src/server.ts**: Express server with a single `/recipes` GET endpoint for filtering recipes
- **src/model/Recipe.ts**: Mongoose schema and TypeScript interface defining the Recipe document structure

### Data Flow
1. Client sends query parameters (ingredients, tags, createdBy, etc.)
2. Server constructs MongoDB filter based on query parameters
3. Mongoose retrieves matching recipes from MongoDB
4. Server returns JSON array of recipes

## Key Patterns & Conventions

### Query Filtering Pattern
The `/recipes` endpoint uses a dynamic filter object built from query parameters:
- **Ingredient/tag filtering**: Split comma-separated query strings, convert to lowercase for consistency
- **Filter type control**: `?any=true` uses MongoDB `$in` operator (OR logic); `?any=false` (default) uses `$all` (AND logic)
- **Optional filters**: Missing query parameters are simply not added to the filter object

Example: `/recipes?ingredients=salt,pepper&any=false` requires both salt AND pepper.

### MongoDB Filter Operators
- `{ $in: [...] }` - Matches documents where field contains ANY of the values (OR)
- `{ $all: [...] }` - Matches documents where field contains ALL of the values (AND)

### TypeScript Setup
- Strict mode enabled
- CommonJS module format with Node module resolution
- Target: ES2020
- Compiled to `./dist` directory from `./src` source

### Environment Configuration
- Uses `dotenv` for environment variables
- `MONGODB_URI`: Connection string (with retry settings and appName)
- `PORT`: Server port (default: 3000)

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

## Important Implementation Details

### Case Normalization
Ingredients and tags are converted to lowercase during filtering (`toLowerCase()`) for case-insensitive matching against the stored data.

### Error Handling
- MongoDB connection errors logged to console with details
- Request errors return 500 status with error message
- No explicit validation on query parameters (type: `any`)

### Current Limitations
- Only GET endpoint exists (no POST/PUT/DELETE)
- No request validation or sanitization
- Type casting to `any` for query parameters could cause runtime issues
- Unused import in Recipe.ts: `triggerAsyncId` from 'node:async_hooks'

## When Adding Features
- Maintain the `.ts` → `.js` compilation workflow via `npm run build`
- Follow TypeScript strict mode conventions
- Use Mongoose schema validation for data integrity
- Test query filtering logic thoroughly (especially $in vs $all behavior)
- Update `.env` with any new environment variables needed
