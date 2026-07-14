-- Demo data: one admin account + one published cyber-security quiz (Lao),
-- so a full game can be run immediately after `supabase db push`.
--
-- Demo admin login:
--   email:    admin@ceit.demo
--   password: CyberDemo123!

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'admin@ceit.demo',
  extensions.crypt('CyberDemo123!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

-- profiles row is created by the on_auth_user_created trigger; give it a
-- friendlier display name.
update public.profiles
  set display_name = 'CEIT Admin'
  where id = '11111111-1111-1111-1111-111111111111';

insert into public.quizzes (id, owner_id, title, description, is_published)
values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'ຄວາມປອດໄພທາງໄຊເບີເບື້ອງຕົ້ນ',
  'ແບບທົດສອບຄວາມຮູ້ພື້ນຖານກ່ຽວກັບຄວາມປອດໄພທາງໄຊເບີ ສຳລັບທຸກຄົນ',
  true
);

-- Q1: phishing
with q as (
  insert into public.questions (quiz_id, order_index, type, body, explanation, time_limit_seconds, points_base)
  values (
    '22222222-2222-2222-2222-222222222222', 0, 'multiple_choice',
    'ອີເມວທີ່ອ້າງວ່າມາຈາກທະນາຄານ ແລະ ຂໍໃຫ້ທ່ານກົດລິ້ງເພື່ອ "ຢືນຢັນບັນຊີ" ດ່ວນ ແມ່ນຮູບແບບການໂຈມຕີແບບໃດ?',
    'ນີ້ແມ່ນ Phishing — ການປອມຕົວເປັນອົງກອນທີ່ໜ້າເຊື່ອຖືເພື່ອຫຼອກລວງໃຫ້ເຫຍື່ອເປີດເຜີຍຂໍ້ມູນສ່ວນຕົວ ຫຼື ກົດລິ້ງອັນຕະລາຍ.',
    20, 1000
  ) returning id
)
insert into public.answer_options (question_id, order_index, label, is_correct)
select id, 0, 'Phishing (ການຫຼອກລວງທາງອີເມວ)', true from q
union all select id, 1, 'DDoS (ໂຈມຕີແບບປະຕິເສດການໃຫ້ບໍລິການ)', false from q
union all select id, 2, 'Brute Force (ການເດົາລະຫັດຜ່ານ)', false from q
union all select id, 3, 'SQL Injection', false from q;

-- Q2: passwords
with q as (
  insert into public.questions (quiz_id, order_index, type, body, explanation, time_limit_seconds, points_base)
  values (
    '22222222-2222-2222-2222-222222222222', 1, 'multiple_choice',
    'ລະຫັດຜ່ານແບບໃດທີ່ປອດໄພທີ່ສຸດ?',
    'ລະຫັດຜ່ານທີ່ດີຄວນຍາວ, ປະສົມຕົວອັກສອນ-ໂຕເລກ-ສັນຍາລັກ ແລະ ບໍ່ຄວນໃຊ້ຊ້ຳກັນລະຫວ່າງບັນຊີຕ່າງໆ.',
    20, 1000
  ) returning id
)
insert into public.answer_options (question_id, order_index, label, is_correct)
select id, 0, '123456', false from q
union all select id, 1, 'ວັນເດືອນປີເກີດຂອງຕົນເອງ', false from q
union all select id, 2, 'Tr0ub4dor&3xplode!2024', true from q
union all select id, 3, 'password', false from q;

-- Q3: 2FA (true/false)
with q as (
  insert into public.questions (quiz_id, order_index, type, body, explanation, time_limit_seconds, points_base)
  values (
    '22222222-2222-2222-2222-222222222222', 2, 'true_false',
    'ການຢືນຢັນຕົວຕົນສອງຂັ້ນຕອນ (2FA) ຊ່ວຍເພີ່ມຄວາມປອດໄພໃຫ້ບັນຊີ ເຖິງແມ່ນລະຫັດຜ່ານຈະຖືກລັກໄປແລ້ວ.',
    'ຖືກຕ້ອງ — 2FA ຕ້ອງການປັດໄຈຢືນຢັນທີສອງ (ເຊັ່ນ: ລະຫັດ OTP) ເຮັດໃຫ້ຜູ້ໂຈມຕີໃຊ້ພຽງລະຫັດຜ່ານບໍ່ພຽງພໍທີ່ຈະເຂົ້າສູ່ລະບົບໄດ້.',
    15, 1000
  ) returning id
)
insert into public.answer_options (question_id, order_index, label, is_correct)
select id, 0, 'ຖືກຕ້ອງ', true from q
union all select id, 1, 'ບໍ່ຖືກຕ້ອງ', false from q;

-- Q4: malware
with q as (
  insert into public.questions (quiz_id, order_index, type, body, explanation, time_limit_seconds, points_base)
  values (
    '22222222-2222-2222-2222-222222222222', 3, 'multiple_choice',
    'ມັນແວທີ່ເຂົ້າລະຫັດ (encrypt) ໄຟລ໌ຂອງເຫຍື່ອ ແລ້ວຮຽກຮ້ອງເງິນເພື່ອປົດລັອກ ເອີ້ນວ່າຫຍັງ?',
    'Ransomware ຈະເຂົ້າລະຫັດຂໍ້ມູນຂອງເຫຍື່ອ ແລະ ຮຽກຮ້ອງຄ່າໄຖ່ (ransom) ເພື່ອແລກກັບກະແຈຖອດລະຫັດ.',
    20, 1000
  ) returning id
)
insert into public.answer_options (question_id, order_index, label, is_correct)
select id, 0, 'Adware', false from q
union all select id, 1, 'Ransomware', true from q
union all select id, 2, 'Spyware', false from q
union all select id, 3, 'Worm', false from q;

-- Q5: social engineering
with q as (
  insert into public.questions (quiz_id, order_index, type, body, explanation, time_limit_seconds, points_base)
  values (
    '22222222-2222-2222-2222-222222222222', 4, 'multiple_choice',
    'ການທີ່ຄົນຮ້າຍໂທຫາພະນັກງານ ແລ້ວປອມຕົວເປັນ IT Support ເພື່ອຂໍລະຫັດຜ່ານ ແມ່ນຕົວຢ່າງຂອງຫຍັງ?',
    'Social Engineering ຄືການໃຊ້ຈິດຕະວິທະຍາຫຼອກລວງໃຫ້ຄົນເປີດເຜີຍຂໍ້ມູນ ແທນທີ່ຈະໂຈມຕີລະບົບໂດຍກົງ.',
    20, 1000
  ) returning id
)
insert into public.answer_options (question_id, order_index, label, is_correct)
select id, 0, 'Social Engineering', true from q
union all select id, 1, 'Firewall Bypass', false from q
union all select id, 2, 'Port Scanning', false from q
union all select id, 3, 'Man-in-the-Middle', false from q;
