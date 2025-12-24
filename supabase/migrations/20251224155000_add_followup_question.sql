-- Add followup_question column to email_reminders
alter table email_reminders 
add column if not exists followup_question text;
