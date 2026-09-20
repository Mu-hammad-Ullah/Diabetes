// Blood glucose classification + general lifestyle guidance.
// সব মান mmol/L। এটা diagnosis নয় — reading-কে চেনা range-এ ফেলে সাধারণ পরামর্শ দেয়,
// আর বিপজ্জনক মানে স্পষ্টভাবে ডাক্তার দেখাতে বলে। ওষুধের dose কখনো suggest করে না।
//
// Range reference: ADA / WHO thresholds
//   Fasting:     <3.9 hypo | 3.9–5.6 normal | 5.7–6.9 prediabetes | ≥7.0 diabetes | ≥14 danger
//   After meal:  <3.9 hypo | 3.9–7.8 normal | 7.9–11.0 prediabetes | ≥11.1 diabetes | ≥14 danger
//   Random/bed:  same as after-meal thresholds

import type { Locale, ReadingType } from './database.types';

export type Severity = 'low' | 'normal' | 'moderate' | 'high' | 'critical';

export interface Classification {
  severity: Severity;
  /** tailwind color token */
  color: 'sky' | 'emerald' | 'amber' | 'orange' | 'red';
}

const SEVERITY_ORDER: Severity[] = ['normal', 'moderate', 'high', 'low', 'critical'];
const COLOR: Record<Severity, Classification['color']> = {
  low: 'sky',
  normal: 'emerald',
  moderate: 'amber',
  high: 'orange',
  critical: 'red',
};

export function classify(value: number, type: ReadingType): Classification {
  let severity: Severity;
  if (value < 3.9) severity = 'low';
  else if (value >= 14) severity = 'critical';
  else if (type === 'fasting') {
    if (value <= 5.6) severity = 'normal';
    else if (value <= 6.9) severity = 'moderate';
    else severity = 'high';
  } else {
    if (value <= 7.8) severity = 'normal';
    else if (value <= 11.0) severity = 'moderate';
    else severity = 'high';
  }
  return { severity, color: COLOR[severity] };
}

/** দুইটার মধ্যে যেটা বেশি গুরুতর */
export function worse(a: Severity, b: Severity): Severity {
  return SEVERITY_ORDER.indexOf(a) >= SEVERITY_ORDER.indexOf(b) ? a : b;
}

export function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / 18) * 10) / 10;
}

export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * 18);
}

// HbA1c (%) — diagnosis নয়, শুধু range label
export function classifyHba1c(v: number): Classification {
  if (v < 5.7) return { severity: 'normal', color: 'emerald' };
  if (v < 6.5) return { severity: 'moderate', color: 'amber' };
  if (v < 9) return { severity: 'high', color: 'orange' };
  return { severity: 'critical', color: 'red' };
}

// ---------------------------------------------------------------------------
// Text — বাংলা ও English
// ---------------------------------------------------------------------------

const LABELS: Record<Locale, Record<Severity, string>> = {
  bn: {
    low: 'কম (হাইপোগ্লাইসেমিয়া ঝুঁকি)',
    normal: 'স্বাভাবিক',
    moderate: 'প্রি-ডায়াবেটিস রেঞ্জ',
    high: 'উচ্চ',
    critical: 'অত্যন্ত উচ্চ — বিপজ্জনক',
  },
  en: {
    low: 'Low (hypoglycemia risk)',
    normal: 'Normal',
    moderate: 'Prediabetes range',
    high: 'High',
    critical: 'Very high — dangerous',
  },
};

const ADVICE: Record<Locale, Record<Severity, string[]>> = {
  bn: {
    low: [
      'এখনই ১৫ গ্রাম দ্রুত কার্বোহাইড্রেট নিন — আধা গ্লাস ফলের রস, ১ চামচ চিনি বা ৩–৪টা গ্লুকোজ ট্যাবলেট',
      '১৫ মিনিট পর আবার সুগার মাপুন; এখনো কম থাকলে আবার নিন',
      'ইনসুলিন বা সালফোনাইলইউরিয়া ওষুধ খেলে ঘন ঘন কম হওয়া গুরুত্বপূর্ণ — ডাক্তারকে জানান',
      'গাড়ি চালানো বা ভারী কাজ থেকে বিরত থাকুন যতক্ষণ না স্বাভাবিক হয়',
    ],
    normal: [
      'চমৎকার! এই অভ্যাসগুলো চালিয়ে যান',
      'সুষম ও নিয়মিত সময়ে খাবার খান, খাবার বাদ দেবেন না',
      'প্রতিদিন অন্তত ৩০ মিনিট হাঁটুন বা হালকা ব্যায়াম করুন',
      'নিয়মিত সুগার পরীক্ষা ও ডাক্তারের follow-up চালিয়ে যান',
    ],
    moderate: [
      'চিনি, মিষ্টি, কোমল পানীয় ও মিষ্টি ফলের রস এড়িয়ে চলুন',
      'ভাত, রুটি, আলুর পরিমাণ কমান; সবজি, ডাল ও আঁশযুক্ত খাবার বাড়ান',
      'খাবারের পর ১০–১৫ মিনিট হাঁটুন — এটা after-meal সুগার কমাতে খুব কার্যকর',
      'পরবর্তী চেকআপে এই রিডিংগুলো ডাক্তারকে দেখান',
    ],
    high: [
      'চিনি ও উচ্চ কার্বোহাইড্রেট খাবার সম্পূর্ণ এড়িয়ে চলুন',
      'প্রচুর পানি পান করুন (কিডনি সমস্যা না থাকলে)',
      'ওষুধ নিয়মিত ও সঠিক সময়ে খাচ্ছেন কি না নিশ্চিত করুন — নিজে dose বদলাবেন না',
      'পরপর কয়েকদিন এমন থাকলে যত দ্রুত সম্ভব ডাক্তার দেখান',
    ],
    critical: [
      'এই মাত্রা বিপজ্জনক — আজই ডাক্তার দেখান বা নিকটস্থ হাসপাতালে যান',
      'বমি, পেটব্যথা, শ্বাসকষ্ট, তীব্র দুর্বলতা বা ঘোর লাগলে এখনই জরুরি বিভাগে যান',
      'পানি পান করুন, কিন্তু কোনো ওষুধের dose নিজে থেকে বদলাবেন না',
      'একা থাকবেন না — কাউকে সাথে রাখুন',
    ],
  },
  en: {
    low: [
      'Take 15 g of fast-acting carbs now — half a glass of fruit juice, 1 tsp sugar, or 3–4 glucose tablets',
      'Re-check in 15 minutes; if still low, repeat',
      'If you take insulin or sulfonylureas, frequent lows matter — tell your doctor',
      'Avoid driving or heavy work until you are back to normal',
    ],
    normal: [
      'Great — keep these habits going',
      'Eat balanced meals at regular times; do not skip meals',
      'Walk or do light exercise at least 30 minutes daily',
      'Continue regular testing and doctor follow-ups',
    ],
    moderate: [
      'Avoid sugar, sweets, soft drinks and sweet fruit juices',
      'Reduce rice, bread and potatoes; add more vegetables, lentils and fibre',
      'Walk 10–15 minutes after meals — very effective for post-meal sugar',
      'Show these readings to your doctor at the next check-up',
    ],
    high: [
      'Strictly avoid sugar and high-carbohydrate foods',
      'Drink plenty of water (unless you have kidney problems)',
      'Make sure you are taking medication on time — do not change doses yourself',
      'If this continues for several days, see a doctor as soon as possible',
    ],
    critical: [
      'This level is dangerous — see a doctor today or go to the nearest hospital',
      'If you have vomiting, stomach pain, breathing difficulty, severe weakness or confusion, go to emergency now',
      'Drink water, but do not change any medication dose on your own',
      'Do not stay alone — keep someone with you',
    ],
  },
};

export function severityLabel(severity: Severity, locale: Locale): string {
  return LABELS[locale][severity];
}

export function adviceFor(severity: Severity, locale: Locale): string[] {
  return ADVICE[locale][severity];
}

export const DISCLAIMER: Record<Locale, string> = {
  bn: 'এটি সাধারণ জীবনযাত্রার পরামর্শ, চিকিৎসা নয়। ওষুধ বা ডোজ পরিবর্তনের আগে অবশ্যই ডাক্তারের সাথে কথা বলুন।',
  en: 'This is general lifestyle guidance, not medical advice. Always consult your doctor before changing any medication or dose.',
};

export const READING_TYPE_LABEL: Record<Locale, Record<ReadingType, string>> = {
  bn: { fasting: 'ফাস্টিং', after_meal: 'খাবারের ২ ঘণ্টা পর', random: 'যেকোনো সময়', bedtime: 'ঘুমানোর আগে' },
  en: { fasting: 'Fasting', after_meal: '2h after meal', random: 'Random', bedtime: 'Bedtime' },
};

// Tailwind class maps (দৃশ্যমান হতে হলে class string পুরোটা literal হওয়া লাগে)
export const BADGE_CLASS: Record<Classification['color'], string> = {
  sky: 'bg-sky-100 text-sky-800 ring-sky-200',
  emerald: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  amber: 'bg-amber-100 text-amber-800 ring-amber-200',
  orange: 'bg-orange-100 text-orange-800 ring-orange-200',
  red: 'bg-red-100 text-red-800 ring-red-200',
};

export const PANEL_CLASS: Record<Classification['color'], string> = {
  sky: 'bg-sky-50 border-sky-200 text-sky-900',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  amber: 'bg-amber-50 border-amber-200 text-amber-900',
  orange: 'bg-orange-50 border-orange-200 text-orange-900',
  red: 'bg-red-50 border-red-300 text-red-900',
};

export const HEX_COLOR: Record<Classification['color'], string> = {
  sky: '#0ea5e9',
  emerald: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  red: '#ef4444',
};
