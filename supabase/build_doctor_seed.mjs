// doctors_source.json → seed_doctors.sql
// Run: node supabase/build_doctor_seed.mjs
import fs from 'node:fs';
import path from 'node:path';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const rows = JSON.parse(fs.readFileSync(path.join(dir, 'doctors_source.json'), 'utf8'));

// hospital নাম → hospitals table-এর নাম (match-এর জন্য); Popular Diagnostic: branch থেকে
const HOSPITAL_ALIAS = {
  'Bangladesh Medical University': 'Bangladesh Medical University (formerly BSMMU)',
  'Chittagong Medical College Hospital': 'Chattogram Medical College Hospital',
  'Ibn Sina Trust': 'Ibn Sina Specialized Hospital, Dhanmondi',
  'LABAID Cardiac Hospital': 'LABAID Specialized Hospital',
};
const POPULAR_BRANCH = {
  'Uttara Garib E Newaz (Sector-13)': 'Uttara Sector 13', 'Uttara Jashim Uddin (Sector-04)': 'Uttara Sector 4',
};

const clean = (s) => (s ?? '').toString().trim() || null;
const seen = new Set();
const out = [];
for (const d of rows) {
  const name = clean(d.doctor_name).replace(/\s+/g, ' ');
  const branch = clean(d.branch);
  const key = `${name.toLowerCase()}|${d.hospital}|${branch ?? ''}`;
  if (seen.has(key)) continue;
  seen.add(key);
  let hospitalMatch = HOSPITAL_ALIAS[d.hospital] ?? d.hospital;
  if (d.hospital === 'Popular Diagnostic Centre' && branch) hospitalMatch = `Popular Diagnostic Centre, ${POPULAR_BRANCH[branch] ?? branch}`;
  out.push({
    name, degrees: clean(d.degrees), designation: clean(d.designation), specialty: clean(d.specialty) ?? 'Endocrinology / Diabetology',
    hospital_name: d.hospital === 'Popular Diagnostic Centre' && branch ? `Popular Diagnostic Centre, ${branch}` : d.hospital,
    branch, city: d.district, phone: clean(d.appointment_phone), phone_type: clean(d.phone_type), source_url: clean(d.source_url), hospitalMatch,
  });
}

const q = (s) => s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`;
const sql = `-- =====================================================================
--  Doctor directory — বাংলাদেশ (${out.length} entries)
--  Source: supabase/doctors_source.json → build_doctor_seed.mjs (auto-generated)
--  আগে migration_003_doctor_directory.sql চালান। বারবার চালানো নিরাপদ (upsert)।
-- =====================================================================

insert into public.doctor_directory (name, degrees, designation, specialty, hospital_name, branch, city, phone, phone_type, source_url) values
${out.map((r) => `(${q(r.name)}, ${q(r.degrees)}, ${q(r.designation)}, ${q(r.specialty)}, ${q(r.hospital_name)}, ${q(r.branch)}, ${q(r.city)}, ${q(r.phone)}, ${q(r.phone_type)}, ${q(r.source_url)})`).join(',\n')}
on conflict (lower(name), hospital_name, coalesce(branch, '')) do update
  set degrees = excluded.degrees,
      designation = excluded.designation,
      specialty = excluded.specialty,
      city = excluded.city,
      phone = excluded.phone,
      phone_type = excluded.phone_type,
      source_url = excluded.source_url,
      updated_at = now();

-- hospitals table-এর সাথে link (নাম মিললে)
update public.doctor_directory d set hospital_id = h.id
from public.hospitals h
where d.hospital_id is null and h.name = case d.hospital_name
${[...new Map(out.map((r) => [r.hospital_name, r.hospitalMatch])).entries()].filter(([a, b]) => a !== b).map(([a, b]) => `  when ${q(a)} then ${q(b)}`).join('\n')}
  else d.hospital_name end;
`;
fs.writeFileSync(path.join(dir, 'seed_doctors.sql'), sql);
console.log(`wrote seed_doctors.sql: ${out.length} rows`);
