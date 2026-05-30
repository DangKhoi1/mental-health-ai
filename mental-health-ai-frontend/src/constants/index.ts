const getApiUrl = (envVal: string | undefined): string => {
  const url = envVal || 'http://localhost:8080/api/v1';
  if (!/\/api(\/v\d+)?\/?$/.test(url)) {
    return url.replace(/\/$/, '') + '/api/v1';
  }
  return url;
};

export const API_BASE_URL = getApiUrl(process.env.NEXT_PUBLIC_API_URL);

export { publicPaths, dashboardPaths, apiPaths } from './path';

export * from './messages';
export * from './homepage';
