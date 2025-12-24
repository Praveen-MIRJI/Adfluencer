import nodemailer from 'nodemailer';

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP configuration error:', error);
    } else {
        console.log('SMTP server is ready to send emails');
    }
});

/**
 * Send OTP email for password reset
 */
export const sendOtpEmail = async (email: string, otp: string): Promise<boolean> => {
    try {
        console.log(`[EMAIL] Attempting to send OTP to: ${email}`);
        console.log(`[EMAIL] Using SMTP config: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
        console.log(`[EMAIL] SMTP User: ${process.env.SMTP_USER}`);
        
        const mailOptions = {
            from: `"Adfluencer" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to: email,
            subject: 'Password Reset OTP - Adfluencer',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                        🔐 Password Reset
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #94a3b8;">
                        You requested to reset your password. Use the OTP code below to complete the process:
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background: linear-gradient(135deg, #e11d48 0%, #6366f1 100%); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                        <p style="margin: 0 0 8px; font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 2px;">
                          Your OTP Code
                        </p>
                        <p style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 8px; font-family: monospace;">
                          ${otp}
                        </p>
                      </div>
                      
                      <p style="margin: 24px 0 0; font-size: 13px; color: #64748b; text-align: center;">
                        ⏱️ This code expires in <strong style="color: #f472b6;">10 minutes</strong>
                      </p>
                      
                      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0;">
                      
                      <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
                        If you didn't request this password reset, please ignore this email or contact support if you have concerns.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 40px; background: rgba(0,0,0,0.2); text-align: center;">
                      <p style="margin: 0; font-size: 12px; color: #475569;">
                        © ${new Date().getFullYear()} Adfluencer. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL] OTP email sent successfully:', info.messageId);
        console.log('[EMAIL] Preview URL:', nodemailer.getTestMessageUrl(info));
        console.log('[DEV] OTP for', email, ':', otp); // Log OTP for development testing
        return true;
    } catch (error) {
        console.error('[EMAIL] Error sending OTP email:', error);
        
        // Log specific error details
        if (error instanceof Error) {
            console.error('[EMAIL] Error message:', error.message);
            console.error('[EMAIL] Error stack:', error.stack);
        }
        
        return false;
    }
};

/**
 * Generate a random 6-digit OTP
 */
export const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Test email configuration
 */
export const testEmailConfig = async (): Promise<boolean> => {
    try {
        await transporter.verify();
        console.log('[EMAIL] SMTP configuration is valid');
        return true;
    } catch (error) {
        console.error('[EMAIL] SMTP configuration test failed:', error);
        return false;
    }
};