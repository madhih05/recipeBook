import mongoose, { Schema, Document } from 'mongoose';

export interface IRecipe extends Document {
    title: string;
    description: string;
    ingredients: string[];
    tags: string[];
    instructions: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

const recipeSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    ingredients: { type: [String], required: true },
    tags: { type: [String], required: false },
    instructions: { type: String, required: true },
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
});

export default mongoose.model<IRecipe>('Recipe', recipeSchema);