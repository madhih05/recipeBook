// Import Mongoose types for schema definition and document interface
import mongoose, { Schema, Document } from 'mongoose';

/**
 * IRecipe Interface
 * Defines the TypeScript interface for Recipe documents in MongoDB.
 * Extends Document to inherit Mongoose document methods.
 */
export interface IRecipe extends Document {
    title: string;           // Recipe title
    description: string;     // Brief description of the recipe
    ingredients: string[];   // Array of ingredient names (normalized to lowercase)
    tags: string[];          // Array of recipe tags for categorization (normalized to lowercase)
    instructions: string;    // Detailed cooking instructions
    createdBy: string;       // Username of the recipe creator
    createdAt: Date;         // Timestamp when recipe was created
    updatedAt: Date;         // Timestamp when recipe was last updated
}

/**
 * Recipe Mongoose Schema
 * Defines the structure and validation rules for recipe documents in MongoDB.
 */
const recipeSchema: Schema = new Schema({
    title: { type: String, required: true },                    // Recipe name (required)
    description: { type: String, required: true },              // Short description (required)
    ingredients: { type: [String], required: true },            // List of ingredients (required)
    tags: { type: [String], required: false },                  // Optional categorization tags
    instructions: { type: String, required: true },             // Cooking steps (required)
    createdBy: { type: String, required: true },                // Creator's username (required)
    createdAt: { type: Date, default: Date.now },               // Auto-set to current time on creation
    updatedAt: { type: Date },                                  // Manual timestamp for updates
});

// Export the Recipe model for use throughout the application
export default mongoose.model<IRecipe>('Recipe', recipeSchema);