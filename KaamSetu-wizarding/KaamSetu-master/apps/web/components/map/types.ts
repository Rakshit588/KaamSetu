export type LatLng = { lat: number; lng: number };

export type MapPinData = LatLng & {
  id: string;
  kind: 'worker' | 'job';
  available?: boolean;
  selected?: boolean;
};

export type MapViewProps = {
  center: LatLng;
  zoom?: number;
  pins?: MapPinData[];
  /** The viewer's own position, drawn as a blue dot. */
  me?: LatLng | null;
  /** A draggable "job location" pin. Tapping the map also moves it. */
  pickPin?: LatLng | null;
  onPickPinMove?: (position: LatLng) => void;
  onPinClick?: (id: string) => void;
  /** Zoom so every pin is visible. */
  fitToPins?: boolean;
  className?: string;
};
