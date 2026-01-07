import { useEffect, useState } from "react";
import { APP_CONFIG } from "../config/app";

export function useVersionCheck() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    fetch(`${APP_CONFIG.API_BASE}/app-version`)
      .then(res => res.json())
      .then(data => data.min_version !== APP_CONFIG.VERSION && setBlocked(true));
  }, []);

  return blocked;
}
