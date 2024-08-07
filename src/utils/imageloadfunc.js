async function imageLoadFunction(loadedImage, src) {
  const url = new URL(src.split('?')[0]);
  let objectUrl;
  const img = loadedImage.getImage();

  img.onload = () => {
    URL.revokeObjectURL(objectUrl);
  };

  const WMSOptions = {
    method: 'POST',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded'
    },
    body: src.split('?')[1]
  };
  const response = await fetch(url, WMSOptions);
  if (response.ok) {
    const blob = await response.blob();
    objectUrl = URL.createObjectURL(blob);
    img.src = objectUrl;
  }
}

export default imageLoadFunction;
