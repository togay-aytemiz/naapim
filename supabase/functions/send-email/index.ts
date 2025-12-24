// Supabase Edge Function: send-email
// Resend API integration for NeYapsam email notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendEmailRequest {
    type: 'code_delivery' | 'reminder_14day';
    to: string;
    data: {
        code?: string;
        user_question?: string;
        session_id?: string;
        followup_question?: string;
        schedule_time?: 'tomorrow' | '1_week' | '2_weeks';
    };
}

interface ResendResponse {
    id?: string;
    error?: {
        message: string;
        name: string;
    };
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

// Email content generator based on type
function generateEmailContent(type: string, data: SendEmailRequest['data']): { subject: string; html: string; text: string } {
    const returnUrl = data.code ? `https://naapim.com/return?code=${data.code}` : 'https://naapim.com/return';

    switch (type) {
        case 'code_delivery': {
            const content = `
                <h1 class="text-primary" style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">
                    Takip Kodun 🔑
                </h1>
                <p class="text-secondary" style="font-size: 15px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px 0;">
                     Bu konu üzerindeki düşüncelerin bizim için değerli:
                </p>
                <div class="quote-box" style="background-color: #fff8f0; padding: 16px 20px; border-left: 4px solid #ff6b6b; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                    <p class="text-primary" style="font-size: 15px; font-style: italic; color: #1a1a1a; margin: 0; line-height: 1.5;">
                        "${data.user_question}"
                    </p>
                </div>
                <p class="text-secondary" style="font-size: 15px; line-height: 1.6; color: #4a4a4a; margin: 0 0 24px 0;">
                    Bu anahtarla <strong>yarından itibaren</strong> kararını paylaşıp, seninle aynı durumda olan başkalarının hikayelerini görebilirsin:
                </p>
                <div class="code-box" style="background-color: #f5f5f5; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                    <code class="text-primary" style="font-size: 28px; font-weight: 700; letter-spacing: 3px; color: #1a1a1a; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
                        ${data.code}
                    </code>
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center">
                            <a href="${returnUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(255, 107, 107, 0.4);">
                                Başkaları Ne Düşünüyor? Gör →
                            </a>
                        </td>
                    </tr>
                </table>
            `;
            return {
                subject: '🔑 Takip kodun hazır! Yarın görüşlerini paylaşabilirsin',
                html: wrapEmailContent(content),
                text: `Takip Kodun: ${data.code}\n\nBu kodu naapim.com/return adresinde girerek başkalarının ne düşündüğünü görebilirsin.\n\n---\nNaapim • İstanbul, Türkiye`
            };
        }

        case 'reminder_14day': {
            const headline = data.followup_question || "Kararın ne oldu?";

            const content = `
                <h1 class="text-primary" style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">
                    ${headline}
                </h1>
                <p class="text-secondary" style="font-size: 15px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px 0;">
                    Bir süre önce naapim'da şu konuyu düşünüyordun:
                </p>
                <div class="quote-box" style="background-color: #fff8f0; padding: 16px 20px; border-left: 4px solid #ff6b6b; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                    <p class="text-primary" style="font-size: 15px; font-style: italic; color: #1a1a1a; margin: 0; line-height: 1.5;">
                        "${data.user_question}"
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
                subject: data.followup_question || 'Kararın ne oldu? 🤔',
                html: wrapEmailContent(content),
                text: `${headline}\n\nBir süre önce şu konu için naapim'i kullanmıştın: "${data.user_question}"\n\nKararını paylaşmak ister misin?: ${returnUrl}\n\n---\nNaapim • İstanbul, Türkiye`
            };
        }

        default:
            throw new Error(`Unknown email type: ${type}`);
    }
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!resendApiKey) {
            console.error('RESEND_API_KEY not found')
            return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (!supabaseUrl || !supabaseServiceRoleKey) {
            console.error('SUPABASE credentials not found')
            // Proceeding without DB logging/rate limiting if DB credentials missing, or error out. 
            // Better to error out or log warning. Let's error out for safety.
            return new Response(JSON.stringify({ error: 'Database configuration missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

        const { type, to, data }: SendEmailRequest = await req.json()

        // Validate request
        if (!type || !to) {
            return new Response(JSON.stringify({ error: 'Missing required fields: type, to' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // --- Rate Limiting Start ---
        // Check emails sent to this address in the last 24 hours
        // We use the service role key so we can access the email_logs table without RLS issues (or assume table is private)

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const { count, error: countError } = await supabase
            .from('email_logs')
            .select('*', { count: 'exact', head: true })
            .eq('email', to)
            .gte('sent_at', oneDayAgo)

        if (countError) {
            console.error('Rate limit check failed:', countError)
            // Decide: block or allow? Let's allow but log error, or block. 
            // Blocking is safer for spam.
            return new Response(JSON.stringify({ error: 'Rate limit check failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (count !== null && count >= 3) {
            console.warn(`Rate limit exceeded for ${to}: ${count} emails in last 24h`)
            return new Response(
                JSON.stringify({
                    error: 'Rate limit exceeded',
                    message: 'Günlük e-posta gönderim limitine (3) ulaştınız.'
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
        // --- Rate Limiting End ---

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(to)) {
            return new Response(JSON.stringify({ error: 'Invalid email address' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Generate email content
        const { subject, html, text } = generateEmailContent(type, data)

        // --- Scheduling Logic Start ---
        // If schedule_time is present, we SAVE to DB instead of sending immediately
        if (data.schedule_time) {
            let scheduledAt = new Date();

            // Set time to 06:30 UTC (09:30 TRT/UTC+3)
            // We do this first or last, but important is to respect the day addition.

            // Add days based on selection
            if (data.schedule_time === '1_week') {
                scheduledAt.setDate(scheduledAt.getDate() + 7);
            } else if (data.schedule_time === '2_weeks') {
                scheduledAt.setDate(scheduledAt.getDate() + 14);
            } else {
                // 'tomorrow' or default
                scheduledAt.setDate(scheduledAt.getDate() + 1);
            }

            // Force time to 06:30:00.000 UTC
            scheduledAt.setUTCHours(6, 30, 0, 0);

            const { error: scheduleError } = await supabase
                .from('email_reminders')
                .insert({
                    email: to,
                    reminder_type: type,
                    schedule_time: data.schedule_time,
                    scheduled_at: scheduledAt.toISOString(),
                    code: data.code,
                    user_question: data.user_question,
                    status: 'pending'
                })

            if (scheduleError) {
                console.error('Failed to save reminder:', scheduleError);
                return new Response(JSON.stringify({ error: 'Failed to schedule reminder' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            console.log(`⏰ Reminder scheduled for ${to} at ${scheduledAt.toISOString()} (${data.schedule_time})`);

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Reminder scheduled',
                    scheduled_at: scheduledAt
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }
        // --- Scheduling Logic End ---

        // Send via Resend API
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: 'naapim? <no-reply@notifications.naapim.com>',
                reply_to: 'togayaytemiz@gmail.com',
                to: [to],
                subject,
                html,
                text,
            }),
        })

        const resendData: ResendResponse = await resendResponse.json()

        if (!resendResponse.ok) {
            console.error('Resend API error:', resendData)

            // Log failed attempt (optional, maybe with status 'failed')
            await supabase.from('email_logs').insert({
                email: to,
                email_type: type,
                status: 'failed',
                session_id: data.session_id || null
            })

            return new Response(
                JSON.stringify({
                    error: 'Failed to send email',
                    details: resendData.error?.message
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`📧 Email sent successfully: ${type} to ${to}, id: ${resendData.id}`)

        // --- Logging Success ---
        await supabase.from('email_logs').insert({
            email: to,
            email_type: type,
            status: 'sent',
            session_id: data.session_id || null
        })

        return new Response(
            JSON.stringify({
                success: true,
                message_id: resendData.id,
                type
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Send email error:', error)
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
