// Import Mongoose types for schema definition and document interface
import mongoose, { Schema, Document } from 'mongoose';

/**
 * IUser Interface
 * Defines the TypeScript interface for User documents in MongoDB.
 * Extends Document to inherit Mongoose document methods.
 */
export interface IUser extends Document {
    username: string;                            // Unique username
    email: string;                               // User's email address (stored for login)
    password: string;                            // Password hash (never plain text)
    savedRecipes: mongoose.Types.ObjectId[];     // References to saved Recipe documents
    dietaryPreferences?: string[];                // Optional dietary restrictions/preferences
    createdAt: Date;                             // Account creation timestamp
}

/**
 * User Mongoose Schema
 * Defines the structure and validation rules for user documents in MongoDB.
 */
const UserSchema: Schema = new Schema({
    // Username field - unique identifier for login
    username: {
        type: String,
        required: true,
        unique: true,   // Ensures no duplicate usernames
        trim: true,
        minlength: 3    // Minimum 3 characters
    },
    // Email field - used for account recovery and notifications
    email: {
        type: String,
        required: true,
        unique: true,   // Ensures no duplicate emails
        trim: true,
        lowercase: true // Normalizes email format
    },
    // Password field - stores bcrypt hash, not plain text
    password: {
        type: String,
        required: true,
        minlength: 6    // Minimum 6 characters before hashing
    },
    // Saved recipes feature - stores references to Recipe documents
    savedRecipes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe'   // Population reference to Recipe collection
    }],
    // User's dietary restrictions and preferences
    dietaryPreferences: {
        type: [String],
        default: []     // Empty array if not specified
    },
    // Account creation timestamp - auto-set on document creation
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Export the User model for use throughout the application
export default mongoose.model<IUser>('User', UserSchema);
