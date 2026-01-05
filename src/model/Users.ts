// ============================================================================
// IMPORTS
// ============================================================================

import mongoose, { Schema, Document } from 'mongoose';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * IUser Interface
 * Defines the TypeScript interface for User documents in MongoDB.
 * Extends Document to inherit Mongoose document methods.
 */
export interface IUser extends Document {
    username: string; // Unique username
    email: string; // User's email address (used for login)
    password: string; // Password hash (never plain text)
    savedRecipes?: mongoose.Types.ObjectId[]; // References to saved Recipe documents
    dietaryPreferences?: string[]; // Optional dietary restrictions/preferences
    createdAt: Date; // Account creation timestamp
}

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

/**
 * User Mongoose Schema
 * Defines the structure and validation rules for user documents in MongoDB.
 */
const UserSchema: Schema = new Schema({
    // Username - unique identifier for login
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3, // Minimum 3 characters
    },

    // Email - used for account recovery and notifications
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // Normalizes email format
    },

    // Password - stores bcrypt hash, never plain text
    password: {
        type: String,
        required: true,
        minlength: 6, // Minimum 6 characters before hashing
    },

    // Saved recipes - stores references to Recipe documents
    savedRecipes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            default: [], // Initializes as empty array
        },
    ],

    // User's dietary restrictions and preferences
    dietaryPreferences: {
        type: [String],
        default: [], // Empty array if not specified
    },

    // Account creation timestamp - auto-set on document creation
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

export default mongoose.model<IUser>('User', UserSchema);
