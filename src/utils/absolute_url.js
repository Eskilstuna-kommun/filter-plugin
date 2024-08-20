function getAbsoluteSourceURL(src) {
  let urlString = src;
  if (typeof src === 'object' && src !== null) {
    urlString = typeof src.getUrl === 'function' ? src.getUrl() : src.getUrls()[0];
  }

  if (!urlString.startsWith('http')) {
    urlString = window.location.origin.concat(urlString);
  }
  return urlString;
}

export default getAbsoluteSourceURL;
