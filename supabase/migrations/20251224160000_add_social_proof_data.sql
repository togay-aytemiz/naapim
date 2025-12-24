-- Add social_proof_data column to email_reminders
alter table email_reminders 
add column if not exists social_proof_data jsonb;
