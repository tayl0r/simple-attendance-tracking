CREATE TABLE rosters (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE players (
  id          text PRIMARY KEY,
  roster_id   text NOT NULL REFERENCES rosters(id) ON DELETE CASCADE,
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  UNIQUE (roster_id, first_name, last_name)
);

CREATE TABLE schedules (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id          text PRIMARY KEY,
  schedule_id text NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('game', 'training')),
  date        date NOT NULL,
  time        time NOT NULL,
  location    text NOT NULL,
  week        integer,
  home_team   text,
  away_team   text,
  team        text
);

CREATE TABLE schedule_rosters (
  schedule_id text NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  roster_id   text NOT NULL REFERENCES rosters(id) ON DELETE RESTRICT,
  PRIMARY KEY (schedule_id, roster_id)
);

CREATE TABLE attendance (
  event_id    text NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id   text NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status      text CHECK (status IN ('yes', 'no', 'maybe')),
  notes       text,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, player_id)
);
