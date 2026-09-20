// Hand-written types mirroring supabase/schema.sql.
// Schema বদলালে এখানে-ও বদলাবেন (অথবা `npx supabase gen types` দিয়ে generate করবেন)।

export type UserRole = 'patient' | 'doctor' | 'admin';
export type ReadingType = 'fasting' | 'after_meal' | 'random' | 'bedtime';
export type DiabetesType = 'type1' | 'type2' | 'gestational' | 'prediabetes' | 'unknown';
export type AppointmentStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
export type Slot = 'morning' | 'afternoon' | 'evening';
export type Locale = 'bn' | 'en';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  diabetes_type: DiabetesType;
  diagnosed_year: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  locale: Locale;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  level: 'info' | 'success' | 'warning' | 'danger';
  audience: 'all' | 'patient' | 'doctor';
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  users_total: number; patients: number; doctors_total: number; doctors_verified: number; admins: number; users_7d: number;
  readings_total: number; readings_today: number; readings_7d: number;
  reports_total: number; reports_bytes: number;
  appts_pending: number; appts_accepted: number; appts_total: number;
  hospitals: number; announcements_active: number;
}

export interface GlucoseReading {
  id: string;
  user_id: string;
  reading_type: ReadingType;
  value_mmol: number;
  measured_at: string;
  note: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  report_date: string;
  file_path: string;
  file_type: string;
  file_size: number;
  hba1c: number | null;
  fasting_mmol: number | null;
  pp_mmol: number | null;
  notes: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  profile_id: string;
  specialty: string;
  qualification: string;
  registration_no: string | null;
  hospital_name: string;
  chamber_address: string;
  city: string;
  consultation_fee: number | null;
  available_days: string[];
  available_hours: string | null;
  bio: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorWithProfile extends Doctor {
  profiles: Pick<Profile, 'full_name' | 'phone'> | null;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  requested_date: string;
  requested_slot: Slot;
  reason: string | null;
  status: AppointmentStatus;
  doctor_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  name_bn: string | null;
  type: 'hospital' | 'clinic' | 'diabetic_center';
  address: string | null;
  city: string;
  country_code: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  is_diabetes_specialized: boolean;
  created_at: string;
}

export type NearbyHospital = Omit<Hospital, 'country_code' | 'website' | 'created_at'> & {
  distance_km: number;
};
