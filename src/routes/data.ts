import express, { Request, Response } from 'express';
import Recipe from '../model/Recipe';
import User from '../model/Users';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

/**
 * GET /recipes
 * Query endpoint to filter recipes by ingredients, tags, and creator.
 * Query parameters:
 *   - ingredients: comma-separated ingredient names
 *   - any: true for OR logic (default false for AND logic)
 *   - tags: comma-separated tag names
 *   - tagsAny: true for OR logic on tags (default false for AND logic)
 *   - createdBy: filter by recipe creator's username
 */
router.get('/recipes', async (req: Request, res: Response) => {
    try {
        logger.info('GET /recipes request', { query: req.query });
        // Initialize empty filter object for MongoDB query
        const filter: any = {};

        // Extract and parse ingredients query parameter
        const ingredientsRaw = req.query.ingredients as string;
        const createdBy = req.query.createdBy as string;              // Filter by recipe creator
        const ingredientsFilterType = (req.query.any as string) || 'false';
        const isAny: boolean = ingredientsFilterType.toLowerCase() === 'true';  // Use OR logic for ingredients
        const tagsRaw = req.query.tags as string;
        const tagsFilterType = (req.query.tagsAny as string) || 'false';
        const isTagsAny: boolean = tagsFilterType.toLowerCase() === 'true';     // Use OR logic for tags

        // Apply ingredients filter if provided
        if (ingredientsRaw) {
            // Split comma-separated string and normalize to lowercase
            const ingredients = ingredientsRaw.split(',').map(ing => ing.trim().toLowerCase());
            // Use $in (OR) or $all (AND) operator based on 'any' parameter
            if (isAny) {
                filter.ingredients = { $in: ingredients };    // Match recipes with ANY ingredient
            } else {
                filter.ingredients = { $all: ingredients };   // Match recipes with ALL ingredients
            }
        }

        // Apply creator filter if provided
        if (createdBy) {
            filter.createdBy = createdBy;
        }

        // Apply tags filter if provided
        if (tagsRaw) {
            // Split comma-separated string and normalize to lowercase
            const tags = tagsRaw.split(',').map(tag => tag.trim().toLowerCase());
            // Use $in (OR) or $all (AND) operator based on 'tagsAny' parameter
            if (isTagsAny) {
                filter.tags = { $in: tags };    // Match recipes with ANY tag
            } else {
                filter.tags = { $all: tags };   // Match recipes with ALL tags
            }
        }

        // Query database with constructed filter
        const recipes = await Recipe.find(filter);
        logger.info(`Found ${recipes.length} recipes matching the criteria`, { count: recipes.length, filter });
        // Return recipes as JSON response
        res.json(recipes);
    }
    catch (error: any) {
        // Handle errors and return 500 status
        logger.error('Error fetching recipes', { error: error.message, stack: error.stack, query: req.query });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /user/:username
 * Retrieve a specific user's profile and all recipes they created.
 * Returns user info (excluding email for privacy) and their recipes.
 * Excludes sensitive fields like email and password.
 */
router.get('/user/:username', async (req: Request, res: Response) => {
    try {
        const username = req.params.username;
        logger.info('Fetching user profile and recipes', { username });
        // Fetch all recipes created by this user
        const recipes = await Recipe.find({ createdBy: username });
        // Fetch user document and exclude email field for privacy
        const user = await User.findOne({ username: username }).select('username savedRecipes createdAt');
        // Return 404 if user doesn't exist
        if (!user) {
            logger.warn('User not found', { username });
            return res.status(404).json({ error: 'User not found' });
        }

        // Construct response object with user info and recipes
        const response = {
            userInfo: user,
            userRecipes: recipes,
        }
        logger.info('User profile and recipes fetched successfully', { username, recipeCount: recipes.length });
        // Send combined response
        res.json(response);
    }
    catch (error: any) {
        // Handle errors and return 500 status
        logger.error('Error fetching user profile', { username: req.params.username, error: error.message, stack: error.stack });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /recipes/:id
 * Retrieve a single recipe by its MongoDB ObjectId.
 * Returns the complete recipe document if found.
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
        logger.info('Recipe fetched successfully', { recipeId, title: recipe.title });
        // Return recipe as JSON
        res.json(recipe);
    }
    catch (error: any) {
        // Handle errors (including invalid ObjectId format) and return 500 status
        logger.error('Error fetching recipe', { recipeId: req.params.id, error: error.message, stack: error.stack });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /recipes
 * Create a new recipe (placeholder implementation)
 */
router.post('/recipes', express.json(), authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { title, ingredients, instructions, tags, description } = req.body;
        const createdBy = req.user; // Extracted from authenticated token
        logger.info('Creating new recipe', { title, createdBy, tags });

        // Create new recipe document
        const newRecipe = new Recipe({
            title,
            ingredients,
            instructions,
            tags,
            description,
            createdBy,
            // createdAt: new Date(),
        });

        // Save recipe to database
        await newRecipe.save();

        logger.info('Recipe created successfully', { recipeId: newRecipe._id.toString(), title, createdBy });
        // Return success response with created recipe
        res.status(201).json({ message: 'Recipe created successfully', recipe: newRecipe });
    }
    catch (error: any) {
        // Handle errors and return 500 status
        logger.error('Error creating recipe', { createdBy: req.user, error: error.message, stack: error.stack });
        res.status(500).json({ error: error.message });
    }
});

router.delete('/recipes/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const recipeId = req.params.id;
        const userId = req.user;
        logger.info('Attempting to delete recipe', { recipeId, userId });

        // Find the recipe to ensure it exists and check ownership
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            logger.warn('Delete failed: Recipe not found', { recipeId });
            return res.status(404).json({ error: 'Recipe not found' });
        }
        if (recipe.createdBy !== userId) {
            logger.warn('Delete failed: User does not own recipe', { recipeId, userId, actualOwner: recipe.createdBy });
            return res.status(403).json({ error: 'Forbidden: You can only delete your own recipes' });
        }
        await Recipe.findByIdAndDelete(recipeId);
        logger.info('Recipe deleted successfully', { recipeId, userId, title: recipe.title });
        res.json({ message: 'Recipe deleted successfully' });
    }
    catch (error: any) {
        logger.error('Error deleting recipe', { recipeId: req.params.id, userId: req.user, error: error.message, stack: error.stack });
        res.status(500).json({ error: error.message });
    }
})

export default router;
