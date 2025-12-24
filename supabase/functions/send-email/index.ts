// Supabase Edge Function: send-email
// Resend API integration for NeYapsam email notifications

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
                            <a href="https://naapim.com" style="text-decoration: none;">
                                <span class="text-primary" style="font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 32px; letter-spacing: -1px; color: #1a1a1a; font-feature-settings: 'ss01' 1;">naapim</span><span style="font-family: 'Montserrat', sans-serif; font-weight: 800; font-size: 32px; color: #ff6b6b;">?</span>
                            </a>
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
    switch (type) {
        case 'code_delivery': {
            const content = `
                <h1 class="text-primary" style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 16px 0;">
                    Takip Kodun 🔑
                </h1>
                <p class="text-secondary" style="font-size: 15px; line-height: 1.6; color: #4a4a4a; margin: 0 0 24px 0;">
                    Bu anahtarla <strong>yarından itibaren</strong> kararına geri dönebilir ve başkalarının seninle aynı durumda neler düşündüğünü görebilirsin:
                </p>
                <div class="code-box" style="background-color: #f5f5f5; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                    <code class="text-primary" style="font-size: 28px; font-weight: 700; letter-spacing: 3px; color: #1a1a1a; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">
                        ${data.code}
                    </code>
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td align="center">
                            <a href="https://naapim.com/return" style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(255, 107, 107, 0.4);">
                                Başkaları Ne Düşünüyor? Gör →
                            </a>
                        </td>
                    </tr>
                </table>
            `;
            return {
                subject: `Yarın görüşünü bekliyoruz! (${data.code})`,
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
                            <a href="https://naapim.com/return" style="display: inline-block; background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(255, 107, 107, 0.4);">
                                Kararını Paylaş →
                            </a>
                        </td>
                    </tr>
                </table>
            `;
            return {
                subject: data.followup_question || 'Kararın ne oldu? 🤔',
                html: wrapEmailContent(content),
                text: `${headline}\n\nBir süre önce şu konu için naapim'i kullanmıştın: "${data.user_question}"\n\nKararını paylaşmak ister misin?: https://naapim.com/return\n\n---\nNaapim • İstanbul, Türkiye`
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
        if (!resendApiKey) {
            console.error('RESEND_API_KEY not found in environment')
            return new Response(
                JSON.stringify({ error: 'Email service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { type, to, data }: SendEmailRequest = await req.json()

        // Validate request
        if (!type || !to) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: type, to' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(to)) {
            return new Response(
                JSON.stringify({ error: 'Invalid email address' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Generate email content
        const { subject, html, text } = generateEmailContent(type, data)

        // Send via Resend API
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: 'naapim <no-reply@notifications.naapim.com>',
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
            return new Response(
                JSON.stringify({
                    error: 'Failed to send email',
                    details: resendData.error?.message
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`📧 Email sent successfully: ${type} to ${to}, id: ${resendData.id}`)

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
