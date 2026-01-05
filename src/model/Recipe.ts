// ============================================================================
// IMPORTS
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * IRecipe Interface
 * Defines the TypeScript interface for Recipe documents in MongoDB.
 * Extends Document to inherit Mongoose document methods.
 */
export interface IRecipe extends Document {
    title: string;        // Recipe title
    description: string;  // Brief description of the recipe
    ingredients: string[]; // Array of ingredient names (normalized to lowercase)
    tags: string[];       // Array of recipe tags for categorization (normalized to lowercase)
    instructions: string; // Detailed cooking instructions
    createdBy: string;    // MongoDB ObjectId of the recipe creator
    createdAt: Date;      // Timestamp when recipe was created
    updatedAt: Date;      // Timestamp when recipe was last updated
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * Recipe Mongoose Schema
 * Defines the structure and validation rules for recipe documents in MongoDB.
 */
const recipeSchema: Schema = new Schema({
    // Recipe title (required)
    title: {
        type: String,
        required: true,
    },

    // Short description of the recipe (required)
    description: {
        type: String,
        required: true,
    },

    // Array of ingredient names (required)
    ingredients: {
        type: [String],
        required: true,
    },

    // Array of categorization tags (optional)
    tags: {
        type: [String],
        required: false,
    },

    // Detailed cooking instructions (required)
    instructions: {
        type: String,
        required: true,
    },

    // Reference to the User who created this recipe (required)
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Auto-set to current timestamp on creation
    createdAt: {
        type: Date,
        default: Date.now,
    },

    // Manual timestamp for updates
    updatedAt: {
        type: Date,
    },
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

export default mongoose.model<IRecipe>('Recipe', recipeSchema);