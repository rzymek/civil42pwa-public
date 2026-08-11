export async function whatIsAtLocation(location: { lat: number, lon: number }): Promise<string> {
  // return a description of what is at location. address, city, business, poi's, etc.
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lon}`,
    {headers: {'User-Agent': 'Civil42PWA/1.0'}}
  );

  if (!response.ok) {
    throw new Error('Failed to fetch location data');
  }

  const data = (await response.json()) as { display_name: string };
  return data.display_name || 'Unknown location';

}