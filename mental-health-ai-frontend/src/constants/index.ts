const getApiUrl = (envVal: string | undefined): string => {
  let url = (envVal || 'http://localhost:8080/api/v1').trim();
  if (url && !/^https?:\/\//i.test(url) && !/^\//.test(url)) {
    const isLocal = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(url.split('/')[0]);
    url = (isLocal ? 'http://' : 'https://') + url;
  }
  if (!/\/api(\/v\d+)?\/?$/.test(url)) {
    return url.replace(/\/$/, '') + '/api/v1';
  }
  return url;
};

export const API_BASE_URL = getApiUrl(process.env.NEXT_PUBLIC_API_URL);

export { publicPaths, dashboardPaths, apiPaths } from './path';

export * from './messages';
export * from './homepage';
