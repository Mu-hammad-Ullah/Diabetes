-- =====================================================================
--  Curated hospital list — বাংলাদেশ
--  schema.sql চালানোর পর এটা চালান। বারবার চালালে duplicate হবে না।
--  Coordinates OpenStreetMap থেকে নেওয়া (±১০০ মিটার)। নতুন hospital
--  যোগ করতে নিচের format-এ একটা লাইন যোগ করুন।
-- =====================================================================

create unique index if not exists hospitals_name_city_uidx on public.hospitals (name, city);

insert into public.hospitals (name, name_bn, type, address, city, lat, lng, phone, is_diabetes_specialized) values
-- ঢাকা — ডায়াবেটিস বিশেষায়িত (BADAS network)
('BIRDEM General Hospital', 'বারডেম জেনারেল হাসপাতাল', 'diabetic_center', '122 Kazi Nazrul Islam Ave, Shahbagh', 'Dhaka', 23.7391, 90.3959, '+880-2-9661551', true),
('BIRDEM General Hospital 2 (Women & Children)', 'বারডেম-২', 'diabetic_center', '1/A Segunbagicha', 'Dhaka', 23.7318, 90.4107, '+880-2-8315008', true),
('Ibrahim Cardiac Hospital & Research Institute', 'ইব্রাহিম কার্ডিয়াক হাসপাতাল', 'hospital', '122 Kazi Nazrul Islam Ave, Shahbagh', 'Dhaka', 23.7396, 90.3965, '+880-2-9671141', true),
('Ibrahim General Hospital (Mirpur)', 'ইব্রাহিম জেনারেল হাসপাতাল, মিরপুর', 'diabetic_center', 'Plot 1, Section 6, Block C, Mirpur', 'Dhaka', 23.8079, 90.3670, '+880-2-9014476', true),
('BIHS General Hospital', 'বিআইএইচএস জেনারেল হাসপাতাল', 'diabetic_center', '125/1 Darus Salam, Mirpur-1', 'Dhaka', 23.7960, 90.3530, '+880-2-9010932', true),
('National Healthcare Network (NHN) Uttara', 'এনএইচএন উত্তরা', 'diabetic_center', 'House 3, Road 11, Sector 6, Uttara', 'Dhaka', 23.8681, 90.3993, '+880-2-8912455', true),
('National Healthcare Network (NHN) Mirpur', 'এনএইচএন মিরপুর', 'diabetic_center', 'Section 10, Mirpur', 'Dhaka', 23.8081, 90.3690, null, true),
-- ঢাকা — সরকারি
('Bangabandhu Sheikh Mujib Medical University (BSMMU)', 'বিএসএমএমইউ', 'hospital', 'Shahbagh', 'Dhaka', 23.7387, 90.3945, '+880-2-9661051', false),
('Dhaka Medical College Hospital', 'ঢাকা মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Secretariat Rd, Ramna', 'Dhaka', 23.7256, 90.3975, '+880-2-55165088', false),
('Shaheed Suhrawardy Medical College Hospital', 'শহীদ সোহরাওয়ার্দী মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Sher-e-Bangla Nagar', 'Dhaka', 23.7708, 90.3712, '+880-2-9130800', false),
('Sir Salimullah Medical College Mitford Hospital', 'স্যার সলিমুল্লাহ মেডিকেল কলেজ (মিটফোর্ড)', 'hospital', 'Mitford Rd', 'Dhaka', 23.7101, 90.4009, '+880-2-7319002', false),
('Kurmitola General Hospital', 'কুর্মিটোলা জেনারেল হাসপাতাল', 'hospital', 'Airport Rd, Cantonment', 'Dhaka', 23.8241, 90.4157, '+880-2-8712081', false),
('Mugda Medical College Hospital', 'মুগদা মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Mugda', 'Dhaka', 23.7268, 90.4293, '+880-2-7275013', false),
-- ঢাকা — বেসরকারি
('Square Hospitals Ltd.', 'স্কয়ার হাসপাতাল', 'hospital', '18/F Bir Uttam Qazi Nuruzzaman Sarak, Panthapath', 'Dhaka', 23.7527, 90.3814, '10616', false),
('United Hospital', 'ইউনাইটেড হাসপাতাল', 'hospital', 'Plot 15, Road 71, Gulshan-2', 'Dhaka', 23.8023, 90.4144, '10666', false),
('Evercare Hospital Dhaka', 'এভারকেয়ার হাসপাতাল', 'hospital', 'Plot 81, Block E, Bashundhara R/A', 'Dhaka', 23.8104, 90.4315, '10678', false),
('Labaid Specialized Hospital', 'ল্যাবএইড স্পেশালাইজড হাসপাতাল', 'hospital', 'House 1, Road 4, Dhanmondi', 'Dhaka', 23.7466, 90.3823, '10606', false),
('Popular Medical College Hospital', 'পপুলার মেডিকেল কলেজ হাসপাতাল', 'hospital', 'House 25, Road 2, Dhanmondi', 'Dhaka', 23.7398, 90.3808, '09613-787801', false),
('Ibn Sina Hospital Dhanmondi', 'ইবনে সিনা হাসপাতাল', 'hospital', 'House 48, Road 9/A, Dhanmondi', 'Dhaka', 23.7451, 90.3752, '10615', false),
('Anwer Khan Modern Medical College Hospital', 'আনোয়ার খান মডার্ন হাসপাতাল', 'hospital', 'House 17, Road 8, Dhanmondi', 'Dhaka', 23.7444, 90.3818, '+880-2-9670295', false),
-- চট্টগ্রাম
('Chittagong Medical College Hospital', 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল', 'hospital', 'K.B. Fazlul Kader Rd, Panchlaish', 'Chattogram', 22.3597, 91.8320, '+880-31-630395', false),
('Chittagong Diabetic General Hospital', 'চট্টগ্রাম ডায়াবেটিক জেনারেল হাসপাতাল', 'diabetic_center', 'Khulshi', 'Chattogram', 22.3570, 91.8003, '+880-31-2554571', true),
('Evercare Hospital Chattogram', 'এভারকেয়ার হাসপাতাল চট্টগ্রাম', 'hospital', 'Anannya R/A, Chattogram', 'Chattogram', 22.4102, 91.8153, '10678', false),
('Chattogram Maa-O-Shishu Hospital', 'চট্টগ্রাম মা ও শিশু হাসপাতাল', 'hospital', 'Agrabad', 'Chattogram', 22.3252, 91.8060, '+880-31-2528040', false),
-- রাজশাহী
('Rajshahi Medical College Hospital', 'রাজশাহী মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Laxmipur', 'Rajshahi', 24.3725, 88.5850, '+880-721-772150', false),
('Rajshahi Diabetic Association General Hospital', 'রাজশাহী ডায়াবেটিক সমিতি হাসপাতাল', 'diabetic_center', 'Jhautola, Kajla', 'Rajshahi', 24.3661, 88.6242, '+880-721-761016', true),
-- খুলনা
('Khulna Medical College Hospital', 'খুলনা মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Boyra', 'Khulna', 22.8085, 89.5480, '+880-41-760350', false),
('Khulna Diabetic Hospital', 'খুলনা ডায়াবেটিক হাসপাতাল', 'diabetic_center', 'Mujgunni, Boyra', 'Khulna', 22.8174, 89.5443, '+880-41-762220', true),
-- সিলেট
('Sylhet M.A.G. Osmani Medical College Hospital', 'সিলেট এম.এ.জি. ওসমানী মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Kajolshah', 'Sylhet', 24.8990, 91.8572, '+880-821-713667', false),
('Sylhet Diabetic Hospital', 'সিলেট ডায়াবেটিক হাসপাতাল', 'diabetic_center', 'Puran Lane, Zindabazar', 'Sylhet', 24.8940, 91.8690, '+880-821-716767', true),
-- বরিশাল
('Sher-e-Bangla Medical College Hospital', 'শের-ই-বাংলা মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Band Rd', 'Barishal', 22.6915, 90.3670, '+880-431-2173547', false),
('Barishal Diabetic Hospital', 'বরিশাল ডায়াবেটিক হাসপাতাল', 'diabetic_center', 'Amanatganj', 'Barishal', 22.7095, 90.3565, null, true),
-- রংপুর
('Rangpur Medical College Hospital', 'রংপুর মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Dhap', 'Rangpur', 25.7580, 89.2400, '+880-521-63388', false),
('Rangpur Diabetic Hospital', 'রংপুর ডায়াবেটিক হাসপাতাল', 'diabetic_center', 'Dhap', 'Rangpur', 25.7520, 89.2470, null, true),
-- ময়মনসিংহ
('Mymensingh Medical College Hospital', 'ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Charpara', 'Mymensingh', 24.7530, 90.3990, '+880-91-66063', false),
('Mymensingh Diabetic Hospital', 'ময়মনসিংহ ডায়াবেটিক হাসপাতাল', 'diabetic_center', 'Charpara', 'Mymensingh', 24.7490, 90.4020, null, true),
-- অন্যান্য বিভাগীয়/জেলা
('Cumilla Medical College Hospital', 'কুমিল্লা মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Kuchaitoli', 'Cumilla', 23.4380, 91.1580, '+880-81-65563', false),
('Cumilla Diabetic Hospital', 'কুমিল্লা ডায়াবেটিক হাসপাতাল', 'diabetic_center', 'Bagichagaon', 'Cumilla', 23.4610, 91.1790, null, true),
('Shaheed Ziaur Rahman Medical College Hospital', 'শহীদ জিয়াউর রহমান মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Silimpur', 'Bogura', 24.8290, 89.3650, '+880-51-66311', false),
('Bogura Diabetic Hospital', 'বগুড়া ডায়াবেটিক হাসপাতাল', 'diabetic_center', 'Sherpur Rd', 'Bogura', 24.8390, 89.3740, null, true),
('Bangabandhu Sheikh Mujib Medical College Hospital', 'ফরিদপুর মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Faridpur', 'Faridpur', 23.6100, 89.8400, '+880-631-63311', false),
('Faridpur Diabetic Association Hospital', 'ফরিদপুর ডায়াবেটিক সমিতি হাসপাতাল', 'diabetic_center', 'Jhiltuli', 'Faridpur', 23.6060, 89.8440, null, true),
('Dinajpur Medical College Hospital', 'দিনাজপুর মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Dinajpur', 'Dinajpur', 25.6300, 88.6400, '+880-531-65521', false),
('Jashore General Hospital', 'যশোর জেনারেল হাসপাতাল', 'hospital', 'Jashore', 'Jashore', 23.1660, 89.2090, null, false),
('Jashore Diabetic Hospital', 'যশোর ডায়াবেটিক হাসপাতাল', 'diabetic_center', 'Jashore', 'Jashore', 23.1700, 89.2140, null, true),
('Cox''s Bazar Sadar Hospital', 'কক্সবাজার সদর হাসপাতাল', 'hospital', 'Cox''s Bazar', 'Cox''s Bazar', 21.4370, 92.0050, null, false),
('Narayanganj General (Victoria) Hospital', 'নারায়ণগঞ্জ ভিক্টোরিয়া হাসপাতাল', 'hospital', 'Narayanganj', 'Narayanganj', 23.6180, 90.5010, null, false),
('Gazipur Shaheed Tajuddin Ahmad Medical College Hospital', 'শহীদ তাজউদ্দীন আহমদ মেডিকেল কলেজ হাসপাতাল', 'hospital', 'Gazipur', 'Gazipur', 24.0020, 90.4200, null, false)
on conflict (name, city) do update
  set name_bn = excluded.name_bn,
      type = excluded.type,
      address = excluded.address,
      lat = excluded.lat,
      lng = excluded.lng,
      phone = excluded.phone,
      is_diabetes_specialized = excluded.is_diabetes_specialized;
