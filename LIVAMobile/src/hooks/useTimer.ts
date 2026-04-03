import {useState, useEffect, useCallback, useRef} from 'react';

export function useTimer() {
  const [timeLeft, setTimeLeft] = useState('0:30');
  const [isLowTime, setIsLowTime] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(30);

  const startTimer = useCallback((startSeconds = 30) => {
    secondsRef.current = startSeconds;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      secondsRef.current -= 1;
      const secs = Math.max(0, secondsRef.current);
      const mins = Math.floor(secs / 60);
      const remainSecs = secs % 60;
      setTimeLeft(`${mins}:${remainSecs.toString().padStart(2, '0')}`);
      setIsLowTime(secs <= 10);

      if (secs <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(
    (startSeconds = 30) => {
      stopTimer();
      startTimer(startSeconds);
    },
    [startTimer, stopTimer],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {timeLeft, isLowTime, startTimer, stopTimer, resetTimer};
}