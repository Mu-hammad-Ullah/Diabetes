'use client';

import dynamic from 'next/dynamic';

const Inner = dynamic(() => import('./mini-map-inner').then((m) => m.MiniMapInner), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl bg-slate-100 sm:h-full sm:min-h-[16rem]" />,
});

export function HospitalMiniMap(props: { lat: number; lng: number; name: string }) {
  return <Inner {...props} />;
}
