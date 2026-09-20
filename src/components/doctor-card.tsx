import Link from 'next/link';
import { MapPin, Phone } from 'lucide-react';
import type { DoctorDirectoryEntry } from '@/lib/database.types';

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

/** hospital নামে জেলা থাকলে আবার জেলা দেখানো হয় না */
export function hospitalLabel(name: string, city: string) {
  return name.toLowerCase().endsWith(city.toLowerCase()) ? name : `${name}, ${city}`;
}

/** Directory doctor card — নাম → /directory/[id], হাসপাতাল → /hospitals/[id] (থাকলে), call button */
export function DoctorCard({ d, hideHospital = false }: { d: DoctorDirectoryEntry; hideHospital?: boolean }) {
  return (
    <li className="card flex flex-col gap-2 py-4 hover:ring-teal-300">
      <div>
        <Link href={`/directory/${d.id}`} className="font-semibold leading-snug hover:text-teal-700">{d.name}</Link>
        {d.designation && <div className="text-xs text-slate-500">{d.designation}</div>}
        {d.degrees && <div className="mt-1 line-clamp-2 text-xs text-slate-600" title={d.degrees}>{d.degrees}</div>}
      </div>
      {!hideHospital && (
        <div className="flex items-start gap-1.5 text-sm text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          {d.hospital_id
            ? <Link href={`/hospitals/${d.hospital_id}`} className="hover:text-teal-700 hover:underline">{hospitalLabel(d.hospital_name, d.city)}</Link>
            : <span>{hospitalLabel(d.hospital_name, d.city)}</span>}
        </div>
      )}
      {d.phone && (
        <a href={telHref(d.phone)} className="btn btn-secondary mt-auto w-full justify-start text-teal-700">
          <Phone className="h-4 w-4" />{d.phone}
          {d.phone_type && <span className="ml-auto text-xs font-normal text-slate-400">{d.phone_type}</span>}
        </a>
      )}
    </li>
  );
}
