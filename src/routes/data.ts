import express, { Request, Response } from 'express';
import Recipe from '../model/Recipe';
import User from '../model/Users';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// ============================================================================
// GET /recipes - Query and filter recipes with pagination
// ============================================================================

/**
 * GET /recipes
 * Query endpoint to filter recipes by ingredients, tags, and creator.
 * Results are paginated and sorted by creation date (newest first).
 *
 * Query parameters:
 *   - ingredients: comma-separated ingredient names
 *   - any: true for OR logic (default false for AND logic)
 *   - tags: comma-separated tag names
 *   - tagsAny: true for OR logic on tags (default false for AND logic)
 *   - page: page number for pagination (default: 1)
 */
router.get('/recipes', async (req: Request, res: Response) => {
    try {
        logger.info('GET /recipes request', { query: req.query });

        // Parse query parameters
        const ingredientsRaw = req.query.ingredients as string;
        const createdBy = req.query.createdBy as string;
        const ingredientsFilterType = (req.query.any as string) || 'false';
        const tagsRaw = req.query.tags as string;
        const tagsFilterType = (req.query.tagsAny as string) || 'false';
        const page = parseInt(req.query.page as string) || 1;

        // Determine filter logic (OR vs AND)
        const isAny: boolean = ingredientsFilterType.toLowerCase() === 'true';
        const isTagsAny: boolean = tagsFilterType.toLowerCase() === 'true';

        // Pagination configuration
        const limit = 60;
        const skip = (page - 1) * limit;

        // Initialize filter object
        const filter: any = {};

        // Apply ingredients filter if provided
        if (ingredientsRaw) {
            const ingredients = ingredientsRaw
                .split(',')
                .map(ing => ing.trim().toLowerCase());

            filter.ingredients = isAny
                ? { $in: ingredients }    // Match ANY ingredient (OR)
                : { $all: ingredients };  // Match ALL ingredients (AND)
        }

        // Apply tags filter if provided
        if (tagsRaw) {
            const tags = tagsRaw
                .split(',')
                .map(tag => tag.trim().toLowerCase());

            filter.tags = isTagsAny
                ? { $in: tags }    // Match ANY tag (OR)
                : { $all: tags };  // Match ALL tags (AND)
        }

        // Query database with constructed filter
        const recipes = await Recipe.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-instructions')
            .populate('createdBy', 'username');

        const totalCount = await Recipe.countDocuments(filter);

        logger.info(`Found ${recipes.length} recipes matching the criteria`, {
            count: recipes.length,
            filter,
        });

        // Return paginated response
        res.json({
            recipes,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                hasPreviousPage: page > 1,
                totalRecipes: totalCount,
                hasNextPage: skip + recipes.length < totalCount,
            },
        });
    } catch (error: any) {
        logger.error('Error fetching recipes', {
            error: error.message,
            stack: error.stack,
            query: req.query,
        });
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /user/:username - Retrieve user profile and their recipes
// ============================================================================

/**
 * GET /user/:username
 * Retrieve a specific user's profile and all recipes they created.
 * Results are paginated with user info and recipe list.
 *
 * Query parameters:
 *   - page: page number for pagination (default: 1)
 *
 * Returns:
 *   - userInfo: user profile (excluding email for privacy)
 *   - userRecipes: paginated list of recipes created by user
 *   - pagination: pagination metadata
 */
router.get('/user/:username', async (req: Request, res: Response) => {
    try {
        const username = req.params.username;
        logger.info('Fetching user profile and recipes', { username });

        // Fetch user document (excluding email for privacy)
        const user = await User.findOne({ username }).select(
            'username savedRecipes createdAt _id'
        );

        // Return 404 if user doesn't exist
        if (!user) {
            logger.warn('User not found', { username });
            return res.status(404).json({ error: 'User not found' });
        }

        // Pagination configuration
        const page = parseInt(req.query.page as string) || 1;
        const limit = 60;
        const skip = (page - 1) * limit;

        // Fetch all recipes created by this user
        const recipes = await Recipe.find({ createdBy: user._id.toString() })
            .select('-instructions -createdBy')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        // Get total count for pagination
        const totalCount = await Recipe.countDocuments({
            createdBy: user._id.toString(),
        });

        logger.info('User profile and recipes fetched successfully', {
            username,
            recipeCount: recipes.length,
        });

        // Construct response with user info and recipes
        res.json({
            userInfo: user,
            userRecipes: recipes,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                hasPreviousPage: page > 1,
                totalRecipes: totalCount,
                hasNextPage: skip + recipes.length < totalCount,
            },
        });
    } catch (error: any) {
        logger.error('Error fetching user profile', {
            username: req.params.username,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// GET /recipes/:id - Retrieve a single recipe by ID
// ============================================================================

/**
 * GET /recipes/:id
 * Retrieve a single recipe by its MongoDB ObjectId.
 * Returns the complete recipe document including instructions.
 */
router.get('/recipes/:id', async (req: Request, res: Response) => {
    try {
        const recipeId = req.params.id;
        logger.info('Fetching recipe by ID', { recipeId });

        // Query recipe by MongoDB ObjectId
        const recipe = await Recipe.findById(recipeId);

        // Return 404 if recipe not found
        if (!recipe) {
            logger.warn('Recipe not found', { recipeId });
            return res.status(404).json({ error: 'Recipe not found' });
        }

        logger.info('Recipe fetched successfully', {
            recipeId,
            title: recipe.title,
        });

        res.json(recipe);
    } catch (error: any) {
        logger.error('Error fetching recipe', {
            recipeId: req.params.id,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// POST /recipes - Create a new recipe
// ============================================================================

/**
 * POST /recipes
 * Create a new recipe with the authenticated user as the creator.
 * Requires valid JWT token in Authorization header.
 *
 * Request body:
 *   - title: recipe title
 *   - description: recipe description
 *   - ingredients: array of ingredient names
 *   - instructions: cooking instructions
 *   - tags: array of recipe tags
 */
router.post(
    '/recipes',
    express.json(),
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const { title, ingredients, instructions, tags, description } =
                req.body;
            const createdBy = req.user; // Extracted from authenticated token

            logger.info('Creating new recipe', {
                title,
                createdBy,
                tags,
            });

            // Create new recipe document
            const newRecipe = new Recipe({
                title,
                ingredients,
                instructions,
                tags,
                description,
                createdBy,
            });

            // Save recipe to database
            await newRecipe.save();

            logger.info('Recipe created successfully', {
                recipeId: newRecipe._id.toString(),
                title,
                createdBy,
            });

            res.status(201).json({
                message: 'Recipe created successfully',
                recipe: newRecipe,
            });
        } catch (error: any) {
            logger.error('Error creating recipe', {
                createdBy: req.user,
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({ error: error.message });
        }
    }
);

router.put('/recipes/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    const recipeId = req.params.id;
    const userId = req.user;
    const updateData = req.body;

    try {
        // Check authentication
        if (!userId) {
            logger.warn('Update failed: User not authenticated');
            return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
        }

        logger.info('Attempting to update recipe', {
            recipeId,
            userId,
        });

        // Find the recipe to ensure it exists
        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            logger.warn('Update failed: Recipe not found', { recipeId });
            return res.status(404).json({ error: 'Recipe not found' });
        }

        // Check ownership
        if (recipe.createdBy.toString() !== userId) {
            logger.warn('Update failed: User does not own recipe', {
                recipeId,
                userId,
                actualOwner: recipe.createdBy,
            });
            return res.status(403).json({
                error: 'Forbidden: You can only update your own recipes',
            });
        }

        // Update the recipe with new data

        const updatedRecipe = await Recipe.findByIdAndUpdate(
            recipeId,
            { ...updateData, updatedAt: new Date() },
            { new: true }
        );

        logger.info('Recipe updated successfully', {
            recipeId,
            userId,
            updatedRecipe,
        });

        res.json({
            message: 'Recipe updated successfully',
            recipe: updatedRecipe,
        });
    } catch (error: any) {
        logger.error('Error updating recipe', {
            recipeId: req.params.id,
            userId: req.user,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// DELETE /recipes/:id - Delete a recipe
// ============================================================================

/**
 * DELETE /recipes/:id
 * Delete a recipe (requires authentication and recipe ownership).
 * Users can only delete their own recipes.
 */
router.delete(
    '/recipes/:id',
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const recipeId = req.params.id;
            const userId = req.user;

            logger.info('Attempting to delete recipe', {
                recipeId,
                userId,
            });

            // Find the recipe to ensure it exists
            const recipe = await Recipe.findById(recipeId);

            if (!recipe) {
                logger.warn('Delete failed: Recipe not found', { recipeId });
                return res.status(404).json({ error: 'Recipe not found' });
            }

            // Check ownership
            if (recipe.createdBy !== userId) {
                logger.warn('Delete failed: User does not own recipe', {
                    recipeId,
                    userId,
                    actualOwner: recipe.createdBy,
                });
                return res.status(403).json({
                    error: 'Forbidden: You can only delete your own recipes',
                });
            }

            // Delete the recipe
            await Recipe.findByIdAndDelete(recipeId);

            logger.info('Recipe deleted successfully', {
                recipeId,
                userId,
                title: recipe.title,
            });

            res.json({ message: 'Recipe deleted successfully' });
        } catch (error: any) {
            logger.error('Error deleting recipe', {
                recipeId: req.params.id,
                userId: req.user,
                error: error.message,
                stack: error.stack,
            });
            res.status(500).json({ error: error.message });
        }
    }
);

router.post('/recipes/:id/save', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const recipeId = req.params.id;
        const userId = req.user;

        logger.info('Saving recipe to user profile', {
            recipeId,
            userId,
        });

        const user = await User.findById(userId);
        if (!user) {
            logger.warn('Save failed: User not found', { userId });
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.savedRecipes) {
            user.savedRecipes = [];
        }

        const isSaved = user.savedRecipes.some(id => id.toString() === recipeId);
        if (isSaved) {
            logger.info('Removing from saved recipes', {
                recipeId,
                userId,
            });
            user.savedRecipes = user.savedRecipes.filter(id => id.toString() !== recipeId);
            await user.save();
            res.json({ message: 'Recipe removed from saved recipes' });
        } else {
            logger.info('Adding to saved recipes', {
                recipeId,
                userId,
            });
            user.savedRecipes.push(recipeId as any);
            await user.save();
            res.json({ message: 'Recipe saved successfully' });
        }
    } catch (error: any) {
        logger.error('Error saving recipe to user profile', {
            recipeId: req.params.id,
            userId: req.user,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: error.message });
    }
});

export default router;
