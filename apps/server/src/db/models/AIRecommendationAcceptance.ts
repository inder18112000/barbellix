import { Schema, model, Types } from 'mongoose';

export interface AIRecommendationAcceptanceDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  recommendationId: string;
  acceptedAt: Date;
}

const schema = new Schema<AIRecommendationAcceptanceDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recommendationId: { type: String, required: true },
  acceptedAt: { type: Date, required: true, default: Date.now },
});

schema.index({ userId: 1, recommendationId: 1 }, { unique: true });

export const AIRecommendationAcceptanceModel = model<AIRecommendationAcceptanceDocument>(
  'AIRecommendationAcceptance',
  schema,
);
