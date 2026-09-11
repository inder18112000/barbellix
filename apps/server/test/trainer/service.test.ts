import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotFoundError } from '../../src/lib/errors.js';

const findAssignedMemberByIdInTenant = vi.fn();
const findMemberByIdInTenant = vi.fn();
const findPlanForMember = vi.fn();
const supersedePlan = vi.fn();

vi.mock('../../src/modules/trainer/repository.js', () => ({
  findAssignedMemberByIdInTenant,
  findMemberByIdInTenant,
  findPlanForMember,
  supersedePlan,
}));

const { updateMemberPlan } = await import('../../src/modules/trainer/service.js');

const MEMBER = { _id: 'member-doc' };
const PLAN = { _id: { toString: () => 'plan-1' }, userId: 'member-1', version: 1 };
const SUPERSEDED_PLAN = { _id: { toString: () => 'plan-2' }, version: 2 };

describe('updateMemberPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findPlanForMember.mockResolvedValue(PLAN);
    supersedePlan.mockResolvedValue(SUPERSEDED_PLAN);
  });

  it('scopes a trainer requester to their own assigned members, not the whole tenant', async () => {
    findAssignedMemberByIdInTenant.mockResolvedValue(MEMBER);

    await updateMemberPlan({ id: 'trainer-1', role: 'trainer' }, 'tenant-1', 'member-1', 'plan-1', {});

    expect(findAssignedMemberByIdInTenant).toHaveBeenCalledWith('member-1', 'tenant-1', 'trainer-1');
    expect(findMemberByIdInTenant).not.toHaveBeenCalled();
  });

  it('gives admin/superadmin the whole tenant, not just their assigned members', async () => {
    findMemberByIdInTenant.mockResolvedValue(MEMBER);

    await updateMemberPlan({ id: 'admin-1', role: 'admin' }, 'tenant-1', 'member-1', 'plan-1', {});

    expect(findMemberByIdInTenant).toHaveBeenCalledWith('member-1', 'tenant-1');
    expect(findAssignedMemberByIdInTenant).not.toHaveBeenCalled();

    findMemberByIdInTenant.mockClear();
    await updateMemberPlan({ id: 'superadmin-1', role: 'superadmin' }, 'tenant-1', 'member-1', 'plan-1', {});
    expect(findMemberByIdInTenant).toHaveBeenCalledWith('member-1', 'tenant-1');
  });

  it('throws NotFoundError when a trainer targets a member not assigned to them (scoped lookup returns null)', async () => {
    findAssignedMemberByIdInTenant.mockResolvedValue(null);

    await expect(
      updateMemberPlan({ id: 'trainer-1', role: 'trainer' }, 'tenant-1', 'someone-elses-member', 'plan-1', {}),
    ).rejects.toThrow(NotFoundError);
    expect(findPlanForMember).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the plan does not belong to this member', async () => {
    findMemberByIdInTenant.mockResolvedValue(MEMBER);
    findPlanForMember.mockResolvedValue(null);

    await expect(
      updateMemberPlan({ id: 'admin-1', role: 'admin' }, 'tenant-1', 'member-1', 'someone-elses-plan', {}),
    ).rejects.toThrow(NotFoundError);
    expect(supersedePlan).not.toHaveBeenCalled();
  });

  it('supersedes (not mutates) the plan, passing requester id and change note through, and returns the new version', async () => {
    findMemberByIdInTenant.mockResolvedValue(MEMBER);

    const result = await updateMemberPlan({ id: 'admin-1', role: 'admin' }, 'tenant-1', 'member-1', 'plan-1', {
      name: 'Updated name',
      changeNote: 'Reduced volume for deload week',
    });

    expect(supersedePlan).toHaveBeenCalledWith(
      PLAN,
      { name: 'Updated name', changeNote: 'Reduced volume for deload week' },
      'admin-1',
      'Reduced volume for deload week',
    );
    expect(result).toEqual({ planId: 'plan-2', version: 2, success: true });
  });
});
