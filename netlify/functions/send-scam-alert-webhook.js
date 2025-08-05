// Alternative GRATUITE : Webhook vers Discord/Slack/Telegram
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { projectId, reportCount } = JSON.parse(event.body);
        
        // Get project details
        const { data: project } = await supabase
            .from('projects')
            .select('title, website, description')
            .eq('id', projectId)
            .single();
        
        if (!project) {
            throw new Error('Project not found');
        }
        
        // Get recent reports
        const { data: reports } = await supabase
            .from('scam_reports')
            .select('reason, severity, created_at')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(5);
        
        // Option 1: Discord Webhook (GRATUIT)
        if (process.env.DISCORD_WEBHOOK_URL) {
            const discordMessage = {
                embeds: [{
                    title: `⚠️ SCAM ALERT: ${project.title}`,
                    description: project.description || 'No description',
                    color: 0xEF4444, // Red
                    fields: [
                        {
                            name: '📊 Total Reports',
                            value: `${reportCount}`,
                            inline: true
                        },
                        {
                            name: '🌐 Website',
                            value: project.website || 'N/A',
                            inline: true
                        },
                        {
                            name: '📝 Recent Reports',
                            value: reports.map(r => `• ${r.reason}`).join('\n').substring(0, 500) || 'No details'
                        }
                    ],
                    footer: {
                        text: 'Kaspa Ecosystem Alert System'
                    },
                    timestamp: new Date().toISOString()
                }]
            };
            
            await fetch(process.env.DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(discordMessage)
            });
        }
        
        // Option 2: Telegram Bot (GRATUIT)
        if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            const telegramMessage = `
⚠️ *SCAM ALERT*

🚨 *Project:* ${project.title}
📊 *Reports:* ${reportCount}
🌐 *Website:* ${project.website || 'N/A'}

📝 *Recent Reports:*
${reports.map(r => `• ${r.reason}`).join('\n').substring(0, 500)}

[View in Admin Panel](${process.env.URL}/admin.html#scam-reports)
`;
            
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: process.env.TELEGRAM_CHAT_ID,
                    text: telegramMessage,
                    parse_mode: 'Markdown'
                })
            });
        }
        
        // Option 3: Slack Webhook (GRATUIT)
        if (process.env.SLACK_WEBHOOK_URL) {
            const slackMessage = {
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: `⚠️ SCAM ALERT: ${project.title}`
                        }
                    },
                    {
                        type: 'section',
                        fields: [
                            {
                                type: 'mrkdwn',
                                text: `*Reports:* ${reportCount}`
                            },
                            {
                                type: 'mrkdwn',
                                text: `*Website:* ${project.website || 'N/A'}`
                            }
                        ]
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: `*Recent Reports:*\n${reports.map(r => `• ${r.reason}`).join('\n').substring(0, 500)}`
                        }
                    }
                ]
            };
            
            await fetch(process.env.SLACK_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slackMessage)
            });
        }
        
        // Option 4: Webhook.site ou n8n (GRATUIT pour tester)
        if (process.env.CUSTOM_WEBHOOK_URL) {
            await fetch(process.env.CUSTOM_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alert: 'scam_report',
                    project,
                    reportCount,
                    reports,
                    timestamp: new Date().toISOString(),
                    adminUrl: `${process.env.URL}/admin.html#scam-reports`
                })
            });
        }
        
        // Log the alert
        await supabase
            .from('activity_logs')
            .insert({
                action: 'scam_alert_sent',
                metadata: {
                    project_id: projectId,
                    project_title: project.title,
                    report_count: reportCount,
                    webhook_sent: true
                }
            });
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: 'Alert sent successfully' 
            })
        };
        
    } catch (error) {
        console.error('Error sending scam alert:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to send alert',
                details: error.message 
            })
        };
    }
};
