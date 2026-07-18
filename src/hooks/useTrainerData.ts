/**
 * useTrainerData - SRP: owns all trainer dashboard data fetching.
 * Provides members list, trainer stats, and plan-assignment mutation.
 * Screens consume this hook; no direct useQuery calls in trainer screens.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  queryKeys,
  fetchTrainerMembers,
  fetchTrainerStats,
  fetchWorkoutPlans,
  assignPlanToMember,
} from '../api/queries';

export function useTrainerData() {
  const qc = useQueryClient();

  const {
    data: members = [],
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: queryKeys.trainer.members,
    queryFn: fetchTrainerMembers,
  });

  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: queryKeys.trainer.stats,
    queryFn: fetchTrainerStats,
  });

  const {
    data: plans = [],
    isLoading: plansLoading,
  } = useQuery({
    queryKey: queryKeys.workoutPlans,
    queryFn: fetchWorkoutPlans,
  });

  const { mutate: assignPlan, isPending: assigning } = useMutation({
    mutationFn: ({ memberId, planId }: { memberId: string; planId: string }) =>
      assignPlanToMember(memberId, planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.trainer.members });
    },
  });

  return {
    members,
    membersLoading,
    membersError,
    refetchMembers,
    stats,
    statsLoading,
    plans,
    plansLoading,
    assignPlan,
    assigning,
    isLoading: membersLoading || statsLoading,
  };
}
