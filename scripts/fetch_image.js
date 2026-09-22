async function getDirectUrl(unsplashPageUrl) {
  const res = await fetch(unsplashPageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const match = html.match(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-_]+/);
  return match ? match[0] : null;
}

getDirectUrl('https://unsplash.com/photos/an-open-book-and-a-cup-of-coffee-on-a-table-3o-eT9n9qY4')
  .then(url => console.log('Found URL:', url))
  .catch(err => console.error(err));
