import { AIRecommendationAcceptanceModel } from '../../db/models/AIRecommendationAcceptance.js';

export async function markAccepted(userId: string, recommendationId: string) {
  await AIRecommendationAcceptanceModel.findOneAndUpdate(
    { userId, recommendationId },
    { $setOnInsert: { acceptedAt: new Date() } },
    { upsert: true },
  );
}
