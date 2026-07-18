-- Create the questions table (matches MCQ JSON structure)
CREATE TABLE public.questions (
  id text PRIMARY KEY,
  statement text NOT NULL,
  options jsonb NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('a','b','c','d','e')),
  explanation jsonb NOT NULL DEFAULT '{}',
  subject text NOT NULL,
  topic text,
  tags text[] DEFAULT '{}',
  year integer,
  academic_year integer DEFAULT 1,
  difficulty text NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','moderate','hard')),
  module text NOT NULL DEFAULT '',
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read questions (public access for the app)
CREATE POLICY "Questions are publicly readable"
  ON public.questions
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Indexes for fast filtering
CREATE INDEX idx_questions_subject ON public.questions(subject);
CREATE INDEX idx_questions_academic_year ON public.questions(academic_year);
CREATE INDEX idx_questions_difficulty ON public.questions(difficulty);
CREATE INDEX idx_questions_module ON public.questions(module);
