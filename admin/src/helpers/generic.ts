import { useIntl } from 'react-intl';

/**
 * Get the current locale, based off of the useIntl hook locale.
 * If the browser locale matches the useIntl hook locale, allow the browser to be more specific (e.g. en-GB vs en-US).
 * @returns string locale
 */
export const getLocale = () => {
  const { locale: strapiLocale } = useIntl();

  // if we don't have access to the window, go with what we have
  if (typeof window === 'undefined') return strapiLocale;

  const browserLocale = navigator.language || (navigator.languages && navigator.languages[0]);

  // if the browser locale matches the strapi locale, allow the browser to be more specific (e.g. en-GB vs en-US)
  if (browserLocale.startsWith(strapiLocale)) return browserLocale;

  // last resort, return what we have
  return strapiLocale;
};

/**
 * Checks if a string can be parsed into a valid JavaScript Date object.
 * @param input - The date string to validate.
 * @returns boolean
 */
export const isValidDate = (input: string): boolean => {
  const timestamp = Date.parse(input);

  return !isNaN(timestamp);
};
