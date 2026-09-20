'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function MiniMapInner({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    const icon = L.divIcon({ className: '', iconSize: [26, 34], iconAnchor: [13, 34], popupAnchor: [0, -30],
      html: '<svg width="26" height="34" viewBox="0 0 26 34"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.5 13 21 13 21s13-11.5 13-21C26 5.8 20.2 0 13 0z" fill="#0d9488"/><circle cx="13" cy="13" r="5" fill="#fff"/></svg>' });
    L.marker([lat, lng], { icon }).addTo(map).bindPopup(`<strong>${name.replace(/</g, '&lt;')}</strong>`);
    return () => { map.remove(); };
  }, [lat, lng, name]);
  return <div ref={el} className="h-64 w-full overflow-hidden rounded-xl ring-1 ring-slate-200 sm:h-full sm:min-h-[16rem]" />;
}
