const baseUrl = import.meta.env.VITE_API_URL as string | undefined;

if (!baseUrl) {
  throw new Error(
    'VITE_API_URL no está definida. Copia frontend/.env.example a frontend/.env y configura la variable.',
  );
}

export const httpClient = {
  get(path: string): Promise<Response> {
    return fetch(`${baseUrl}${path}`);
  },
};
