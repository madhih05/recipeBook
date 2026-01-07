import express, { Request, Response } from 'express';
import Recipe from '../model/Recipe';
import User from '../model/Users';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

const router = express.Router();

// ============================================================================
// GET /user/search - Search users
// ============================================================================

/**
 * GET /user/search
 * Search for users by username using a regex pattern.
 *
 * Query parameters:
 *   - q: search query string
 */
router.get('/search', async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;
        logger.info('Searching users', { query });

        if (!query || query.trim() === '') {
            logger.warn('Search query is empty');
            return res.status(400).json({ error: 'Search query cannot be empty' });
        }

        const users = await User.find({
            username: { $regex: query.toLowerCase(), $options: 'i' },
        }).select('username createdAt');

        logger.info(`Found ${users.length} users matching the search`, {
            query,
            count: users.length,
        });

        if (users.length === 0) {
            return res.status(404).json({ error: 'No users found' });
        }

        res.json({ users });
    }
    catch (error: any) {
        logger.error('Error searching users', {
            query: req.query.q,
            error: error.message,
            stack: error.stack,
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
router.get('/:username', async (req: Request, res: Response) => {
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
// POST /user/:userid/follow - Follow/unfollow a user
// ============================================================================

/**
 * POST /user/:userid/follow
 * Follow or unfollow a user (requires authentication).
 * Toggles the follow state (if following, unfollows; if not following, follows).
 */
router.post('/:userid/follow', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const targetUserId = req.params.userid;
        const userId = req.user;

        logger.info('Toggling follow status', {
            targetUserId,
            userId,
        });

        const user = await User.findById(userId);
        if (!user) {
            logger.warn('Follow failed: User not found', { userId });
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.following) {
            user.following = [];
        }

        const targetUser = await User.findById(targetUserId).select('username');
        if (!targetUser) {
            logger.warn('Follow failed: Target user not found', { targetUserId });
            return res.status(404).json({ error: 'Target user not found' });
        }

        const isFollowing = user.following.some(id => id.toString() === targetUserId);
        if (isFollowing) {
            logger.info('Unfollowing user', {
                targetUserId,
                userId,
            });
            user.following = user.following.filter(id => id.toString() !== targetUserId);
            await user.save();
            res.json({ message: `Unfollowed ${targetUser.username}` });
        } else {
            logger.info('Following user', {
                targetUserId,
                userId,
            });
            user.following.push(targetUserId as any);
            await user.save();
            res.json({ message: `Followed ${targetUser.username}` });
        }
    }
    catch (error: any) {
        logger.error('Error toggling follow status', {
            targetUserId: req.params.userid,
            userId: req.user,
            error: error.message,
            stack: error.stack,
        });
        res.status(500).json({ error: error.message });
    }
});

export default router;
