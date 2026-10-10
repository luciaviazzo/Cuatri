import { useEffect, useState } from 'react';
import { getCarreras } from '../service/plan.js';
import type { CarreraResumen } from '../types/plan.js';

export function useCarreras() {
  const [carreras, setCarreras] = useState<CarreraResumen[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCarreras()
      .then(setCarreras)
      .catch(() => setError('No se pudieron cargar las carreras'));
  }, []);

  return { carreras, error };
}
