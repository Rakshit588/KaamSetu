'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLng, MapPinData, MapViewProps } from './types';

// Pins are plain HTML so they follow our design tokens (Tailwind classes below are picked up by the scanner).
function workerIcon(pin: MapPinData) {
  const ring = pin.available ? '<span class="absolute inset-0 animate-pulse-ring rounded-full bg-mint/60"></span>' : '';
  const dot = pin.available ? 'bg-mint' : 'bg-muted';
  const size = pin.selected ? 'h-5 w-5 ring-4 ring-saffron/50' : 'h-4 w-4';
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<span class="relative flex h-7 w-7 items-center justify-center">${ring}<span class="relative ${size} rounded-full border-2 border-white shadow ${dot}"></span></span>`,
  });
}

const jobIcon = () =>
  L.divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: '<span class="relative flex h-9 w-9 items-center justify-center"><span class="absolute inset-0 animate-pulse-ring rounded-full bg-saffron/50"></span><span class="relative h-5 w-5 rounded-full border-[3px] border-white bg-flame shadow-lg"></span></span>',
  });

const meIcon = () =>
  L.divIcon({
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: '<span class="relative flex h-6 w-6 items-center justify-center"><span class="absolute inset-0 animate-pulse-ring rounded-full bg-brand/40"></span><span class="relative h-3.5 w-3.5 rounded-full border-2 border-white bg-brand shadow"></span></span>',
  });

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    const target = L.latLng(center.lat, center.lng);
    if (!map.getBounds().pad(-0.2).contains(target)) map.setView(target, map.getZoom());
  }, [center.lat, center.lng, map]);
  return null;
}

function FitBounds({ pins, me }: { pins: MapPinData[]; me?: LatLng | null }) {
  const map = useMap();
  const key = pins.map((p) => `${p.id}:${p.lat.toFixed(4)}:${p.lng.toFixed(4)}`).join('|');
  useEffect(() => {
    const points: L.LatLngTuple[] = pins.map((p) => [p.lat, p.lng]);
    if (me) points.push([me.lat, me.lng]);
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points).pad(0.25), { maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function PickOnClick({ onMove }: { onMove: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onMove({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapViewInner({
  center,
  zoom = 14,
  pins = [],
  me,
  pickPin,
  onPickPinMove,
  onPinClick,
  fitToPins,
}: MapViewProps) {
  const job = useMemo(jobIcon, []);
  const mine = useMemo(meIcon, []);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {fitToPins ? <FitBounds pins={pins} me={me} /> : <Recenter center={center} />}
      {pickPin && onPickPinMove && <PickOnClick onMove={onPickPinMove} />}

      {me && <Marker position={[me.lat, me.lng]} icon={mine} interactive={false} />}

      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={pin.kind === 'job' ? job : workerIcon(pin)}
          eventHandlers={{ click: () => onPinClick?.(pin.id) }}
        />
      ))}

      {pickPin && (
        <Marker
          position={[pickPin.lat, pickPin.lng]}
          icon={job}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const ll = (e.target as L.Marker).getLatLng();
              onPickPinMove?.({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
