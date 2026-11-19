// The place the customer is searching around. Remembered in the browser so the search and booking screens agree.
export type Place = { lat: number; lng: number };

// Demo city: Meerut, Uttar Pradesh
export const DEFAULT_PLACE: Place = { lat: 28.9845, lng: 77.7064 };

const KEY = 'ks-place';

export function loadPlace(): Place {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Place;
      if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) return { lat: p.lat, lng: p.lng };
    }
  } catch {
    /* fall through to the default */
  }
  return DEFAULT_PLACE;
}

export function savePlace(place: Place) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(place));
  } catch {
    /* storage can be blocked; the place then lasts only for this visit */
  }
}
