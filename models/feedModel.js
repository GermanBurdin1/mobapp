export const fetchFeed = async () => {
  const response = await fetch('https://api.example.com/feed');
  return await response.json();
};
