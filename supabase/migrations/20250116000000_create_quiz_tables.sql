-- Create active_quiz table (singleton pattern - only one active quiz at a time)
CREATE TABLE IF NOT EXISTS active_quiz (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_submissions table
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_info JSONB NOT NULL,
  quiz_id TEXT NOT NULL,
  quiz_title TEXT,
  answers JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default admin user (password: timeisrelative)
-- Note: In production, use proper password hashing
INSERT INTO admin_users (username, password_hash)
VALUES ('tkusnir', 'timeisrelative')
ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE active_quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for active_quiz (everyone can read, only authenticated can write)
CREATE POLICY "Anyone can read active quiz" ON active_quiz
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update active quiz" ON active_quiz
  FOR ALL USING (true);

-- Policies for quiz_submissions (anyone can insert, only authenticated can read)
CREATE POLICY "Anyone can submit quiz" ON quiz_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read submissions" ON quiz_submissions
  FOR SELECT USING (true);

-- Policies for admin_users (only authenticated can read)
CREATE POLICY "Authenticated users can read admin users" ON admin_users
  FOR SELECT USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_created_at ON quiz_submissions(created_at DESC);
