import { useState, useEffect, useRef } from 'react';

export interface CurrentTime {
  /** 完整的 Date 物件，可自由取用任何時間屬性 */
  now: Date;
  /** 24 小時制的小時 (0-23) */
  hour: number;
  /** 分鐘 (0-59) */
  minute: number;
  /** 秒 (0-59) */
  second: number;
  /** 星期幾 (0=週日, 1=週一, ... 6=週六) */
  dayOfWeek: number;
  /** 一天中的時段，方便做條件判斷 */
  period: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
}

/**
 * 根據小時判斷當前時段
 * dawn:      04:00 ~ 06:59 (黎明)
 * morning:   07:00 ~ 11:59 (早上)
 * noon:      12:00 ~ 13:59 (中午)
 * afternoon: 14:00 ~ 17:59 (下午)
 * evening:   18:00 ~ 20:59 (傍晚)
 * night:     21:00 ~ 03:59 (夜晚)
 */
function getPeriod(hour: number): CurrentTime['period'] {
  if (hour >= 4 && hour < 7)   return 'dawn';
  if (hour >= 7 && hour < 12)  return 'morning';
  if (hour >= 12 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
}

/**
 * 全域後臺時鐘 Hook
 *
 * 每秒更新一次當前時間，供各頁面與功能模塊使用。
 * 不在介面上顯示，僅作為時間來源供後續功能擴展。
 *
 * @example
 * const { hour, period } = useCurrentTime();
 * // period === 'morning' → 顯示早安問候
 * // hour >= 22 → 觸發夜間模式
 */
export function useCurrentTime(): CurrentTime {
  const [now, setNow] = useState<Date>(() => new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // NOTE: 每秒精準對齊整秒觸發，減少累積誤差
    const syncToNextSecond = () => {
      setNow(new Date());
      intervalRef.current = setInterval(() => {
        setNow(new Date());
      }, 1000);
    };

    // 先對齊到下一個整秒再開始計時，提高精準度
    const msUntilNextSecond = 1000 - (Date.now() % 1000);
    const timeoutId = setTimeout(syncToNextSecond, msUntilNextSecond);

    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  const dayOfWeek = now.getDay();

  return {
    now,
    hour,
    minute,
    second,
    dayOfWeek,
    period: getPeriod(hour),
  };
}
