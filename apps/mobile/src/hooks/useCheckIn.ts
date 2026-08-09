/**
 * useCheckIn -- SRP: owns the entire check-in mutation lifecycle.
 * Invalidates attendance queries on success and drives CheckInState.
 * DIP: QRCheckInScreen depends on this hook, not on useMutation directly.
 */
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, checkIn } from '../api/queries';

export type CheckInState = 'idle' | 'processing' | 'success' | 'error';
export type CheckInAction = 'checked_in' | 'checked_out';

interface UseCheckInReturn {
  checkInState: CheckInState;
  streak: number;
  action: CheckInAction;
  scanQR: (qrToken: string) => void;
  enterPin: (pin: string) => void;
  reset: () => void;
}

export function useCheckIn(onSuccess?: () => void): UseCheckInReturn {
  const qc = useQueryClient();
  const [checkInState, setCheckInState] = useState<CheckInState>('idle');
  const [streak, setStreak] = useState(0);
  const [action, setAction] = useState<CheckInAction>('checked_in');

  const { mutate: doCheckIn } = useMutation({
    mutationFn: checkIn,
    onMutate: () => setCheckInState('processing'),
    onSuccess: (data) => {
      setStreak(data.summary?.streak ?? 0);
      setAction(data.action);
      setCheckInState('success');
      qc.invalidateQueries({ queryKey: queryKeys.attendance.summary });
      qc.invalidateQueries({ queryKey: queryKeys.attendance.history });
      if (onSuccess) {
        setTimeout(onSuccess, 2500);
      }
    },
    onError: () => {
      setCheckInState('error');
      setTimeout(() => setCheckInState('idle'), 2500);
    },
  });

  const scanQR = useCallback(
    (qrToken: string) => doCheckIn({ qrToken }),
    [doCheckIn],
  );

  const enterPin = useCallback(
    (pin: string) => doCheckIn({ pin }),
    [doCheckIn],
  );

  const reset = useCallback(() => setCheckInState('idle'), []);

  return { checkInState, streak, action, scanQR, enterPin, reset };
}
