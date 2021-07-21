/**
 * @param {string} url
 */
export const repoFromUrl = (url) =>
  new URL(url).pathname.split("/").slice(1, 3);
