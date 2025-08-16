</li>
                            </ol>
                            
                            <a href="${process.env.URL}/admin.html#scam-reports" 
                               style="display: inline-block; background: #49EACB; color: #0F172A; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">
                                View in Admin Panel
                            </a>
                        </div>
                    </div>
                    <div style="background: #333; color: #999; padding: 15px; text-align: center; font-size: 12px;">
                        <p style="margin: 0;">This is an automated alert from Kaspa Ecosystem</p>
                    </div>
                </div>
            `
        };
        
        // Send email
        await sgMail.send(emailContent);
        
        // Log the alert
        await supabase
            .from('activity_logs')
            .insert({
                action: 'scam_alert_sent',
                metadata: {
                    project_id: projectId,
                    project_title: project.title,
                    report_count: reportCount,
                    email_sent_to: adminEmail
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
        
        // If email fails, try to log it anyway  
        if (error.response) {
            console.error('Email service error occurred');
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Failed to send alert',
                details: error.message 
            })
        };
    }
};
