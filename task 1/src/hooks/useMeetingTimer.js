import { useState, useEffect } from 'react';

/**
 * Custom hook to track elapsed meeting duration with cleanup
 * @param {boolean} isRunning - whether timer should run (defaults to true)
 * @returns {{ seconds: number, formattedTime: string }}
 */
export function useMeetingTimer(isRunning = true) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  return {
    seconds,
    formattedTime: formatTime(seconds),
  };
}

export default useMeetingTimer;
