-- ⚠️ Supabase 대시보드 좌측 메뉴 "SQL Editor" 에서
--    이 파일 내용 전체를 붙여넣고 [Run] 버튼을 누르세요.

create extension if not exists "pgcrypto";

-- 매일의 공통 문제 3개가 저장되는 테이블
create table if not exists public.problems (
  id uuid primary key default gen_random_uuid(),
  problem_date date not null,
  skill_id text not null,
  skill_label text not null,
  skill_desc text not null,
  skill_time int not null,
  topic text not null,
  passages jsonb not null,
  chart jsonb,
  question text not null,
  created_at timestamptz not null default now(),
  unique (problem_date, skill_id)
);

-- 유저 프로필(닉네임, 디데이)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  dday_label text,
  dday_date date,
  joined date not null default current_date
);

-- 유저별 제출/채점 기록
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid references public.problems(id) on delete set null,
  problem_date date not null,
  topic text not null,
  skill_label text not null,
  answer_text text not null,
  score int not null,
  feedback text not null,
  model_answer text not null,
  created_at timestamptz not null default now()
);

alter table public.problems enable row level security;
alter table public.profiles enable row level security;
alter table public.submissions enable row level security;

-- problems: 로그인한 사용자라면 누구나 읽기 가능 (쓰기는 서버의 서비스 키로만 수행)
drop policy if exists "problems_select_authenticated" on public.problems;
create policy "problems_select_authenticated"
  on public.problems for select
  to authenticated
  using (true);

-- profiles: 본인 것만 읽기/쓰기
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- submissions: 본인 것만 읽기 (쓰기는 서버의 서비스 키로만 수행)
drop policy if exists "submissions_select_own" on public.submissions;
create policy "submissions_select_own"
  on public.submissions for select
  to authenticated
  using (auth.uid() = user_id);
