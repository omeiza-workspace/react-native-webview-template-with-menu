
import { useEffect, useState } from 'react';
import { APP_CONFIG } from '../config/app';

export function useMaintenance() {
  const [state, setState] = useState(false);
  useEffect(() => {
    fetch(`${APP_CONFIG.API_BASE}/app-status`).then(r=>r.json()).then(d=>setState(d.maintenance));
  }, []);
  return state;
}
