export function getApiBaseUrl(value: string | undefined): string {
  return (value ?? 'http://localhost:3001').replace(/\/+$/, '');
}

