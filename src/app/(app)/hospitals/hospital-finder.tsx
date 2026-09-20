'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { LocateFixed, Loader2, Navigation, Phone, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Hospital, NearbyHospital } from '@/lib/database.types';
import { useI18n } from '@/lib/i18n/client';

const HospitalMap = dynamic(() => import('./hospital-map').then((m) => m.HospitalMap), {
  ssr: false,
  loading: () => <div className="flex h-72 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-500">…</div>,
});

export type MapPoint = {
  id: string; name: string; type: string; address: string | null; lat: number; lng: number;
  phone: string | null; specialized: boolean; distance_km?: number; source: 'curated' | 'osm';
};

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// OpenStreetMap Overpass — public server, slow/unreliable হতে পারে; তাই শুধু supplement
async function fetchOsm(lat: number, lng: number, signal: AbortSignal): Promise<MapPoint[]> {
  const q = `[out:json][timeout:20];(node["amenity"~"hospital|clinic"](around:8000,${lat},${lng});way["amenity"~"hospital|clinic"](around:8000,${lat},${lng}););out center 40;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: `data=${encodeURIComponent(q)}`, signal,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) throw new Error('overpass');
  const json = await res.json();
  return (json.elements as Array<{ id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }>)
    .map((e): MapPoint | null => {
      const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
      const name = e.tags?.['name:bn'] || e.tags?.name || e.tags?.['name:en'];
      if (!la || !lo || !name) return null;
      return {
        id: `osm-${e.id}`, name, type: e.tags?.amenity === 'clinic' ? 'clinic' : 'hospital',
        address: e.tags?.['addr:street'] || e.tags?.['addr:city'] || null, lat: la, lng: lo,
        phone: e.tags?.phone || e.tags?.['contact:phone'] || null, specialized: /diabet/i.test(name), source: 'osm',
      };
    })
    .filter((x): x is MapPoint => x !== null);
}

export function HospitalFinder({ initial }: { initial: Hospital[] }) {
  const { t, locale } = useI18n();
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const [curated, setCurated] = useState<MapPoint[]>(() => initial.map(toPoint));
  const [osm, setOsm] = useState<MapPoint[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toPoint(h: Hospital | NearbyHospital): MapPoint {
    return {
      id: h.id, name: locale === 'bn' && h.name_bn ? h.name_bn : h.name, type: h.type, address: [h.address, h.city].filter(Boolean).join(', '),
      lat: h.lat, lng: h.lng, phone: h.phone, specialized: h.is_diabetes_specialized,
      distance_km: 'distance_km' in h ? h.distance_km : undefined, source: 'curated',
    };
  }

  const locate = useCallback(() => {
    if (!navigator.geolocation) return setStatus(t('noGeo'));
    setBusy(true); setStatus(t('locating'));
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const { latitude: lat, longitude: lng } = coords;
      setUser({ lat, lng });
      const supabase = createClient();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 20000);
      const [rpc, osmRes] = await Promise.allSettled([
        supabase.rpc('nearby_hospitals', { p_lat: lat, p_lng: lng, p_radius_km: 50, p_limit: 30 }),
        fetchOsm(lat, lng, ctrl.signal),
      ]);
      clearTimeout(timer);

      if (rpc.status === 'fulfilled' && rpc.value.data?.length) {
        setCurated((rpc.value.data as NearbyHospital[]).map(toPoint));
      } else {
        // RPC না পেলে বা কিছু না থাকলে: local distance দিয়ে sort
        setCurated(initial.map((h) => ({ ...toPoint(h), distance_km: haversine(lat, lng, h.lat, h.lng) })).sort((a, b) => a.distance_km! - b.distance_km!));
      }
      if (osmRes.status === 'fulfilled') {
        setOsm(osmRes.value.map((p) => ({ ...p, distance_km: haversine(lat, lng, p.lat, p.lng) })).sort((a, b) => a.distance_km! - b.distance_km!));
      }
      setStatus(null); setBusy(false);
    }, () => { setStatus(t('locationDenied')); setBusy(false); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }, [initial, t]); // eslint-disable-line react-hooks/exhaustive-deps

  // curated-এর ৫০০ মিটারের মধ্যে থাকা OSM entry বাদ (duplicate)
  const osmFiltered = useMemo(() => osm.filter((o) => !curated.some((c) => haversine(c.lat, c.lng, o.lat, o.lng) < 0.5)), [osm, curated]);
  const all = useMemo(() => [...curated, ...osmFiltered], [curated, osmFiltered]);

  const mapLabels = useMemo(() => ({ view: t('viewDoctors') }), [t]);
  const typeLabel = (p: MapPoint) => p.type === 'diabetic_center' ? t('typeDiabetic') : p.type === 'clinic' ? t('typeClinic') : t('typeHospital');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={locate} disabled={busy} className="btn btn-primary">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}{t('findNearMe')}
        </button>
        {status && <span className="text-sm text-slate-600">{status}</span>}
      </div>

      <HospitalMap points={all} user={user} labels={mapLabels} />

      <Section title={t('curatedList')} items={curated} typeLabel={typeLabel} t={t} />
      {osmFiltered.length > 0 && <Section title={t('osmResults')} items={osmFiltered} typeLabel={typeLabel} t={t} />}
    </div>
  );
}

function Section({ title, items, typeLabel, t }: { title: string; items: MapPoint[]; typeLabel: (p: MapPoint) => string; t: (k: 'directions' | 'km' | 'diabetesSpecialized') => string }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <ul className="divide-y divide-slate-100 rounded-xl bg-white ring-1 ring-slate-200">
        {items.slice(0, 25).map((p) => (
          <li key={p.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-medium">
                {p.source === 'curated'
                  ? <Link href={`/hospitals/${p.id}`} className="truncate hover:text-teal-700 hover:underline">{p.name}</Link>
                  : <span className="truncate">{p.name}</span>}
                {p.specialized && <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-label={t('diabetesSpecialized')} />}
              </div>
              <div className="truncate text-xs text-slate-500">{typeLabel(p)}{p.address ? ` · ${p.address}` : ''}</div>
            </div>
            {p.distance_km != null && <span className="badge bg-slate-100 text-slate-700 ring-slate-200">{p.distance_km.toFixed(1)} {t('km')}</span>}
            {p.phone && <a href={`tel:${p.phone}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="call"><Phone className="h-4 w-4" /></a>}
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noopener"
              className="rounded-lg p-2 text-teal-700 hover:bg-teal-50" aria-label={t('directions')}><Navigation className="h-4 w-4" /></a>
          </li>
        ))}
      </ul>
    </section>
  );
}
