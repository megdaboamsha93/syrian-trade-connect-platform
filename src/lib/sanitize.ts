import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param dirty - The potentially unsafe HTML string
 * @param options - DOMPurify configuration options
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(
  dirty: string,
  options?: DOMPurify.Config
): string {
  // Default configuration for most use cases
  const defaultConfig: DOMPurify.Config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ...options,
  };

  return DOMPurify.sanitize(dirty, defaultConfig);
}

/**
 * Sanitize plain text content (strips all HTML tags)
 * Used for displaying user input that should never contain HTML
 * @param dirty - The potentially unsafe text
 * @returns Plain text with all HTML stripped
 */
export function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Create a safe object for React dangerouslySetInnerHTML
 * Use sparingly and only when absolutely necessary
 * @param dirty - The HTML string to sanitize
 * @returns Object with __html property containing sanitized HTML
 */
export function createSafeHtml(dirty: string): { __html: string } {
  return {
    __html: sanitizeHtml(dirty),
  };
}

/**
 * Sanitize URL to prevent javascript: and data: URL attacks
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Convert to lowercase for checking
  const lowerUrl = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return '';
  }

  // Allow http, https, mailto, tel
  if (
    lowerUrl.startsWith('http://') ||
    lowerUrl.startsWith('https://') ||
    lowerUrl.startsWith('mailto:') ||
    lowerUrl.startsWith('tel:') ||
    lowerUrl.startsWith('/')
  ) {
    return url.trim();
  }

  // Default: add https:// if no protocol
  return `https://${url.trim()}`;
}
