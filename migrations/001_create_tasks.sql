CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_login varchar(255) NOT NULL,
  title varchar(200) NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  done boolean NOT NULL DEFAULT false,
  run_id varchar(64) NOT NULL CHECK (run_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_owner_run_idx ON tasks (owner_login, run_id);
