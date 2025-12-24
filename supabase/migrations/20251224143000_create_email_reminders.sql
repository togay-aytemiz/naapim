-- Create email_reminders table for scheduled notifications
CREATE TABLE IF NOT EXISTS email_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    reminder_type TEXT NOT NULL,
    schedule_time TEXT NOT NULL, -- 'tomorrow', '1_week', '2_weeks'
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    code TEXT,
    user_question TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying pending reminders
CREATE INDEX idx_email_reminders_status_scheduled_at ON email_reminders(status, scheduled_at);
CREATE INDEX idx_email_reminders_email ON email_reminders(email);
