/**
 * useCheckIn -- SRP: owns the entire check-in mutation lifecycle.
 * Invalidates attendance queries on success and drives CheckInState.
 * DIP: QRCheckInScreen depends on this hook, not on useMutation directly.
 */
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, checkIn } from '../api/queries';

export type CheckInState = 'idle' | 'processing' | 'success' | 'error';

interface UseCheckInReturn {
  checkInState: CheckInState;
  streak: number;
  scanQR: (qrToken: string) => void;
  enterPin: (pin: string) => void;
  reset: () => void;
}

export function useCheckIn(onSuccess?: () => void): UseCheckInReturn {
  const qc = useQueryClient();
  const [checkInState, setCheckInState] = useState<CheckInState>('idle');
  const [streak, setStreak] = useState(0);

  const { mutate: doCheckIn } = useMutation({
    mutationFn: checkIn,
    onMutate: () => setCheckInState('processing'),
    onSuccess: (data) => {
      setStreak(data.summary?.streak ?? 0);
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

  return { checkInState, streak, scanQR, enterPin, reset };
}
