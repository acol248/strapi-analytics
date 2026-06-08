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
