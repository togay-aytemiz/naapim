// Supabase Edge Function: process-reminders
// Scheduled by Cron Job to process pending email reminders

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReminderRow {
    id: string;
    email: string;
    reminder_type: string;
    code: string;
    user_question: string;
    status: string;
}

// Shared email wrapper with logo and anti-spam footer
function wrapEmailContent(content: string): string {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@800&display=swap" rel="stylesheet">
    <style>
        :root { color-scheme: light dark; }
        @media (prefers-color-scheme: dark) {
            .email-body { background-color: #1a1a1a !important; }
            .email-container { background-color: #252525 !important; }
            .text-primary { color: #ffffff !important; }
            .text-secondary { color: #b0b0b0 !important; }
            .text-muted { color: #888888 !important; }
            .code-box { background-color: #333333 !important; }
            .quote-box { background-color: #2a2520 !important; }
        }
    </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" class="email-container" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <!-- Logo Header -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px;">
                            <!-- Light mode logo -->
                            <img class="logo-light" src="https://naapim.com/logo.png" alt="naapim" width="120" height="auto" style="display: block; border: 0;">
                            <!-- Dark mode logo (hidden by default) -->
                            <img class="logo-dark" src="https://naapim.com/logo-beyaz.png" alt="naapim" width="120" height="auto" style="display: none; border: 0;">
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 32px 32px 32px;">
                            ${content}
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; border-top: 1px solid #eeeeee;">
                            <p class="text-muted" style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.5; color: #999999;">
                                Bu email <a href="https://naapim.com" style="color: #ff6b6b; text-decoration: none;">naapim.com</a> tarafından, isteğiniz üzerine gönderilmiştir.
                            </p>
                            <p class="text-muted" style="margin: 0; font-size: 11px; line-height: 1.5; color: #bbbbbb;">
                                Naapim • İstanbul, Türkiye
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

function generateReminderContent(data: ReminderRow): { subject: string; html: string; text: string } {
    const returnUrl = data.code ? `https://naapim.com/return?code=${data.code}` : 'https://naapim.com/return';
    const headline = "Kararın ne oldu?";

    const content = `
        <h1 class="text-primary" style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">
            ${headline}
        </h1>
        <p class="text-secondary" style="font-size: 15px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px 0;">
            Bir süre önce naapim'da şu konuyu düşünüyordun:
        </p>
        <div class="quote-box" style="background-color: #fff8f0; padding: 16px 20px; border-left: 4px solid #ff6b6b; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
            <p class="text-primary" style="font-size: 15px; font-style: italic; color: #1a1a1a; margin: 0; line-height: 1.5;">
                "${data.user_question || ''}"
            </p>
        </div>
        <p class="text-secondary" style="font-size: 15px; line-height: 1.6; color: #4a4a4a; margin: 0 0 24px 0;">
            Hikayeni paylaşmak ister misin? Senin deneyimin, benzer durumda olan başkalarına yol gösterebilir.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td align="center">
                    <a href="${returnUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(255, 107, 107, 0.4);">
                        Kararını Paylaş →
                    </a>
                </td>
            </tr>
        </table>
    `;

    return {
        subject: 'Kararın ne oldu? 🤔',
        html: wrapEmailContent(content),
        text: `${headline}\n\nBir süre önce şu konu için naapim'i kullanmıştın: "${data.user_question}"\n\nKararını paylaşmak ister misin?: ${returnUrl}\n\n---\nNaapim • İstanbul, Türkiye`
    };
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!resendApiKey || !supabaseUrl || !supabaseServiceRoleKey) {
            return new Response(JSON.stringify({ error: 'Configuration missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
        const now = new Date().toISOString()

        // 1. Fetch pending reminders due now or in the past
        const { data: reminders, error: fetchError } = await supabase
            .from('email_reminders')
            .select('*')
            .eq('status', 'pending')
            .lte('scheduled_at', now)
            .limit(50) // Process in batches to avoid timeout

        if (fetchError) {
            console.error('Fetch reminders error:', fetchError)
            return new Response(JSON.stringify({ error: 'Failed to fetch reminders' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (!reminders || reminders.length === 0) {
            return new Response(JSON.stringify({ message: 'No pending reminders' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        console.log(`Processing ${reminders.length} reminders...`)
        const results = []

        // 2. Process each reminder
        for (const reminder of reminders) {
            try {
                // Generate content
                const { subject, html, text } = generateReminderContent(reminder)

                // Send email
                const resendResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${resendApiKey}`,
                    },
                    body: JSON.stringify({
                        from: 'naapim? <no-reply@notifications.naapim.com>',
                        reply_to: 'togayaytemiz@gmail.com',
                        to: [reminder.email],
                        subject,
                        html,
                        text,
                    }),
                })

                if (!resendResponse.ok) {
                    const errorData = await resendResponse.json()
                    console.error(`Failed to send email to ${reminder.email}:`, errorData)

                    // Update status to failed
                    await supabase
                        .from('email_reminders')
                        .update({ status: 'failed', updated_at: new Date().toISOString() })
                        .eq('id', reminder.id)

                    results.push({ id: reminder.id, status: 'failed', error: errorData })
                } else {
                    const data = await resendResponse.json()

                    // Update status to sent
                    await supabase
                        .from('email_reminders')
                        .update({ status: 'sent', updated_at: new Date().toISOString() })
                        .eq('id', reminder.id)

                    // Log to main email logs
                    await supabase.from('email_logs').insert({
                        email: reminder.email,
                        email_type: reminder.reminder_type,
                        status: 'sent',
                        session_id: null
                    })

                    results.push({ id: reminder.id, status: 'sent', provider_id: data.id })
                }

            } catch (err) {
                console.error(`Error processing reminder ${reminder.id}:`, err)
                results.push({ id: reminder.id, status: 'error', error: err })
            }
        }

        return new Response(JSON.stringify({
            success: true,
            processed: results.length,
            results
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('Process reminders error:', error)
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
