CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    email_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'sent',
    session_id UUID REFERENCES sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_email_logs_email_sent_at ON email_logs(email, sent_at);
