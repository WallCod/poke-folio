import { useEffect, useRef } from "react";
import { usePortfolios } from "@/store/usePortfolios";

const POLL_INTERVAL = 60_000; // 60 segundos

export const usePricePolling = () => {
  const refreshPrices = usePortfolios((s) => s.refreshPrices);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(refreshPrices, POLL_INTERVAL);
  };

  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    start();

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        refreshPrices(); // atualiza imediatamente ao retornar à aba
        start();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
};
