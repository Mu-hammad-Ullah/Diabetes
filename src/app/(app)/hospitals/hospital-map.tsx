'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint } from './hospital-finder';

function pin(color: string) {
  return L.divIcon({
    className: '',
    html: `<svg width="26" height="34" viewBox="0 0 26 34"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="${color}"/><circle cx="13" cy="13" r="5" fill="#fff"/></svg>`,
    iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30],
  });
}

const ICON_SPECIAL = pin('#d97706');
const ICON_HOSPITAL = pin('#0d9488');
const ICON_OSM = pin('#64748b');

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function HospitalMap({ points, user }: { points: MapPoint[]; user: { lat: number; lng: number } | null }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const userMarker = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView([23.78, 90.4], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    points.forEach((p) => {
      const icon = p.source === 'osm' ? ICON_OSM : p.specialized ? ICON_SPECIAL : ICON_HOSPITAL;
      L.marker([p.lat, p.lng], { icon }).addTo(layer.current!)
        .bindPopup(`<strong>${esc(p.name)}</strong>${p.address ? `<br><span style="color:#64748b">${esc(p.address)}</span>` : ''}${p.distance_km != null ? `<br>${p.distance_km.toFixed(1)} km` : ''}`);
    });

    if (user) {
      if (userMarker.current) userMarker.current.remove();
      userMarker.current = L.circleMarker([user.lat, user.lng], { radius: 8, color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.9, weight: 2 }).addTo(map.current);
      const near = points.filter((p) => p.distance_km != null && p.distance_km <= 25).slice(0, 12);
      const bounds = L.latLngBounds([[user.lat, user.lng], ...near.map((p) => [p.lat, p.lng] as [number, number])]);
      map.current.fitBounds(bounds.pad(0.2), { maxZoom: 14 });
    }
  }, [points, user]);

  return <div ref={el} className="h-72 w-full overflow-hidden rounded-xl ring-1 ring-slate-200 sm:h-96" />;
}
