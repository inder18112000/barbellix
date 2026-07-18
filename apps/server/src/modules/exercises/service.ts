import * as repo from './repository.js';

export async function searchExercises(tenantId: string, query?: string) {
  const docs = await repo.search(tenantId, query);
  return docs.map(repo.toDomainExercise);
}
