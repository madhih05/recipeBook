import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Recipe, { IRecipe } from './model/Recipe';
import User, { IUser } from './model/Users';


const app = express();
dotenv.config();
const databaseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase';
const port = process.env.PORT || 3000;

mongoose.connect(databaseUri).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Failed to connect to MongoDB', err);
});

app.get('/recipes', async (req: Request, res: Response) => {
    try {
        const filter: any = {};

        const ingredientsRaw = req.query.ingredients as string;
        const createdBy = req.query.createdBy as string;
        const ingredientsFilterType = req.query.any as string;
        const isAny: boolean = ingredientsFilterType.toLowerCase() === 'true';
        const tagsRaw = req.query.tags as string;
        const tagsFilterType = req.query.tagsAny as string;
        const isTagsAny: boolean = tagsFilterType.toLowerCase() === 'true';

        if (ingredientsRaw) {
            const ingredients = ingredientsRaw.split(',').map(ing => ing.trim().toLowerCase());
            if (isAny) {
                filter.ingredients = { $in: ingredients };
            } else {
                filter.ingredients = { $all: ingredients };
            }
        }

        if (createdBy) {
            filter.createdBy = createdBy;
        }

        if (tagsRaw) {
            const tags = tagsRaw.split(',').map(tag => tag.trim().toLowerCase());
            if (isTagsAny) {
                filter.tags = { $in: tags };
            } else {
                filter.tags = { $all: tags };
            }
        }

        const recipes = await Recipe.find(filter);
        console.log(`Found ${recipes.length} recipes matching the criteria.`);
        res.json(recipes);
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
);

app.get('/recipes/:username', async (req: Request, res: Response) => {
    try {
        const username = req.params.username;
        const recipes = await Recipe.find({ createdBy: username });
        res.json(recipes);
    }
});

app.get('/recipes/:id', async (req: Request, res: Response) => {
    try {
        const recipeId = req.params.id;
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        res.json(recipe);
    }
    catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});