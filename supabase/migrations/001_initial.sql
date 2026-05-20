create extension if not exists "uuid-ossp";

create table flights (
  id uuid primary key default uuid_generate_v4(),
  flight_no text not null unique,
  origin text not null,
  destination text not null,
  departs_at timestamptz not null,
  arrives_at timestamptz not null,
  aircraft_type text not null,
  status text not null default 'scheduled' check (status in ('scheduled','delayed','cancelled','completed')),
  base_price numeric(10,2) not null
);

create table seats (
  id uuid primary key default uuid_generate_v4(),
  flight_id uuid not null references flights(id) on delete cascade,
  seat_number text not null,
  class text not null check (class in ('economy','business','first')),
  is_available boolean not null default true,
  extra_fee numeric(10,2) not null default 0,
  unique(flight_id, seat_number)
);

create table bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flight_id uuid not null references flights(id),
  seat_id uuid not null references seats(id),
  status text not null default 'confirmed' check (status in ('confirmed','rescheduled','cancelled')),
  booked_at timestamptz not null default now(),
  total_price numeric(10,2) not null,
  pnr_code text not null unique default upper(substring(uuid_generate_v4()::text, 1, 8))
);

create table passengers (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  full_name text not null,
  passport_no text not null,
  nationality text not null,
  dob date not null
);

create table reschedules (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  old_flight_id uuid not null references flights(id),
  new_flight_id uuid not null references flights(id),
  requested_at timestamptz not null default now(),
  fee_charged numeric(10,2) not null default 0
);

alter table flights enable row level security;
alter table seats enable row level security;
alter table bookings enable row level security;
alter table passengers enable row level security;
alter table reschedules enable row level security;

create policy "flights_public_read" on flights for select using (true);
create policy "seats_public_read" on seats for select using (true);
create policy "bookings_own_read" on bookings for select using (auth.uid() = user_id);
create policy "bookings_own_insert" on bookings for insert with check (auth.uid() = user_id);
create policy "bookings_own_update" on bookings for update using (auth.uid() = user_id);
create policy "passengers_own_read" on passengers for select using (
  exists (select 1 from bookings where bookings.id = passengers.booking_id and bookings.user_id = auth.uid())
);
create policy "passengers_own_insert" on passengers for insert with check (
  exists (select 1 from bookings where bookings.id = passengers.booking_id and bookings.user_id = auth.uid())
);
create policy "reschedules_own_read" on reschedules for select using (
  exists (select 1 from bookings where bookings.id = reschedules.booking_id and bookings.user_id = auth.uid())
);
create policy "reschedules_own_insert" on reschedules for insert with check (
  exists (select 1 from bookings where bookings.id = reschedules.booking_id and bookings.user_id = auth.uid())
);

create or replace function reserve_seat(
  p_flight_id uuid, p_seat_id uuid, p_user_id uuid, p_total_price numeric, p_pnr_code text
) returns json language plpgsql security definer as $$
declare
  v_seat_available boolean;
  v_booking_id uuid;
begin
  select is_available into v_seat_available from seats
  where id = p_seat_id and flight_id = p_flight_id for update;
  if not found then return json_build_object('success', false, 'error', 'Seat not found'); end if;
  if not v_seat_available then return json_build_object('success', false, 'error', 'Seat is already taken'); end if;
  update seats set is_available = false where id = p_seat_id;
  insert into bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  values (p_user_id, p_flight_id, p_seat_id, p_total_price, p_pnr_code) returning id into v_booking_id;
  return json_build_object('success', true, 'booking_id', v_booking_id);
end;
$$;

create or replace function check_cancellation_window() returns trigger language plpgsql as $$
declare v_departs_at timestamptz;
begin
  if NEW.status = 'cancelled' and OLD.status != 'cancelled' then
    select departs_at into v_departs_at from flights where id = NEW.flight_id;
    if v_departs_at - now() < interval '2 hours' then
      raise exception 'Cancellation not allowed within 2 hours of departure';
    end if;
    update seats set is_available = true where id = NEW.seat_id;
  end if;
  return NEW;
end;
$$;

create trigger enforce_cancellation_window
  before update on bookings for each row
  execute function check_cancellation_window();

create or replace function cancel_booking(p_booking_id uuid, p_user_id uuid)
returns json language plpgsql security definer as $$
declare v_booking bookings%rowtype;
begin
  select * into v_booking from bookings where id = p_booking_id and user_id = p_user_id;
  if not found then return json_build_object('success', false, 'error', 'Booking not found'); end if;
  if v_booking.status = 'cancelled' then return json_build_object('success', false, 'error', 'Already cancelled'); end if;
  update bookings set status = 'cancelled' where id = p_booking_id;
  return json_build_object('success', true);
exception when others then return json_build_object('success', false, 'error', sqlerrm);
end;
$$;