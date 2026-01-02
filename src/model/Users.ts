import mongoose, { Schema, Document } from 'mongoose';

// 1. THE INTERFACE
export interface IUser extends Document {
    username: string;
    email: string;
    password: string; // Will store the HASH, not plain text
    savedRecipes: mongoose.Types.ObjectId[]; // Array of IDs pointing to Recipes
    dietaryPreferences?: string[]; // Optional: ["vegan", "keto"]
    createdAt: Date;
}

// 2. THE SCHEMA
const UserSchema: Schema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,   // No two users can have the same name
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,   // No two users can use the same email
        trim: true,
        lowercase: true // Always convert email to lowercase
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    // The "Favorites" feature
    savedRecipes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe' // This tells Mongo: "These IDs belong to the Recipe collection"
    }],
    dietaryPreferences: {
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model<IUser>('User', UserSchema);
