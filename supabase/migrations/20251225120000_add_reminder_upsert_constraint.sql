-- Add unique constraint on email+code for upsert support in reminder scheduling
-- This allows updating existing reminders instead of creating duplicates

ALTER TABLE email_reminders 
ADD CONSTRAINT email_reminders_email_code_unique 
UNIQUE (email, code);
