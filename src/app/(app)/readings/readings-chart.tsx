'use client';

import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GlucoseReading, ReadingType } from '@/lib/database.types';
import { READING_TYPE_LABEL } from '@/lib/glucose';
import { useI18n } from '@/lib/i18n/client';
import { fmtDateTime } from '@/lib/i18n';

// Fixed categorical hue order (validated: dataviz palette slots 1–4)
const SERIES: { type: ReadingType; color: string }[] = [
  { type: 'fasting', color: '#2a78d6' },
  { type: 'after_meal', color: '#eb6834' },
  { type: 'random', color: '#1baf7a' },
  { type: 'bedtime', color: '#eda100' },
];

type Point = { ts: number } & Partial<Record<ReadingType, number>>;

export function ReadingsChart({ readings }: { readings: GlucoseReading[] }) {
  const { locale } = useI18n();

  const points: Point[] = [...readings]
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .map((r) => ({ ts: new Date(r.measured_at).getTime(), [r.reading_type]: Number(r.value_mmol) }));

  const present = SERIES.filter((s) => readings.some((r) => r.reading_type === s.type));
  const dateFmt = (ts: number) => new Date(ts).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="h-64 w-full text-xs sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-slate-200)" vertical={false} />
          <XAxis dataKey="ts" type="number" domain={['dataMin', 'dataMax']} scale="time" tickFormatter={dateFmt}
            tick={{ fill: 'var(--color-slate-500)' }} axisLine={{ stroke: 'var(--color-slate-300)' }} tickLine={false} minTickGap={24} />
          <YAxis domain={[0, (max: number) => Math.max(15, Math.ceil(max + 1))]} tick={{ fill: 'var(--color-slate-500)' }} axisLine={false} tickLine={false} width={40} />
          <ReferenceLine y={14} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '14', fill: '#ef4444', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={3.9} stroke="#0ea5e9" strokeDasharray="4 4" label={{ value: '3.9', fill: '#0ea5e9', fontSize: 10, position: 'right' }} />
          <Tooltip
            labelFormatter={(ts) => fmtDateTime(new Date(Number(ts)), locale)}
            formatter={(v, name) => [`${Number(v).toFixed(1)} mmol/L`, READING_TYPE_LABEL[locale][name as ReadingType]]}
            contentStyle={{ borderRadius: 8, border: '1px solid var(--color-slate-200)', background: 'var(--color-white)', color: 'var(--color-slate-900)', fontSize: 12 }}
          />
          <Legend formatter={(v) => <span style={{ color: 'var(--color-slate-700)' }}>{READING_TYPE_LABEL[locale][v as ReadingType]}</span>} iconType="circle" iconSize={8} />
          {present.map((s) => (
            <Line key={s.type} type="monotone" dataKey={s.type} stroke={s.color} strokeWidth={2} connectNulls
              dot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: s.color }} activeDot={{ r: 6 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
