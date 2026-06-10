/**
 * Helper function to get the JWT token from cookies
 * @returns jwt token
 */
export const getToken = () => {
  const cookies = document.cookie.split(';');
  const cookie_token = cookies.find((cookie) => cookie.trim().startsWith('jwtToken='));

  if (cookie_token) return cookie_token.split('=')[1]?.replace(/['"]+/g, '');

  const local_token = localStorage.getItem('jwtToken');
  if (local_token) return local_token.replace(/['"]+/g, '');

  return null;
};

/**
 * Helper function to fetch analytics data from the backend
 * @param query URL query parameters
 * @returns analytics raw data
 */
export const getData = async (query: Record<string, any> = {}) => {
  const token = getToken();

  const queryString = new URLSearchParams(query).toString();
  const res = await fetch(`/strapi-analytics/data?${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch analytics data.');

  const data = await res.json();
  return data;
};

/**
 * Helper function to fetch content types from the backend
 * @returns list of content types
 */
export const getContentTypes = async () => {
  const token = getToken();

  const res = await fetch(`/content-manager/content-types`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch content types.');

  const data = await res.json();
  return data;
};

/**
 * Helper function to fetch a specific content type by UID from the backend
 * @param uid content type UID
 * @returns content type data
 */
export const getContentType = async (uid: string) => {
  const token = getToken();

  const res = await fetch(`/content-type-builder/content-types/${uid}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch content type.');

  const data = await res.json();
  return data;
};

/**
 * Get the tracking code from the backend
 * @returns tracking code data
 */
export const getCode = async () => {
  const token = getToken();

  const res = await fetch(`/strapi-analytics/code`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch tracking code.');

  const data = await res.json();
  return data;
};

/**
 * Generate a new tracking code and store it in the backend
 * @returns new tracking code data
 */
export const generateCode = async () => {
  const token = getToken();

  const res = await fetch(`/strapi-analytics/generate-code`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to generate tracking code.');

  const data = await res.json();
  return data;
};
