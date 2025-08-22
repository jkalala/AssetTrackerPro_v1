// Notification utility for geofence events
import { createClient } from './supabase/server'
import nodemailer from 'nodemailer';
// Add a type-only import for nodemailer to avoid runtime issues in edge/serverless environments
import type nodemailerType from 'nodemailer';

export async function sendGeofenceEventNotification(userId: string, asset: any, geofence: any, eventType: 'entry' | 'exit') {
  const supabase = await createClient()
  // In-app notification (insert into notifications table)
  await supabase.from('notifications').insert({
    user_id: userId,
    title: `Asset ${asset.name} ${eventType === 'entry' ? 'entered' : 'exited'} geofence`,
    body: `Asset ${asset.name} (${asset.asset_id}) ${eventType === 'entry' ? 'entered' : 'exited'} zone: ${geofence.name}`,
    type: 'geofence',
    data: { asset_id: asset.id, geofence_id: geofence.id, event_type: eventType },
    read: false
  })
  // (Optional) Email notification logic can be added here
}

// Add a transactional email utility for invitations
export async function sendInvitationEmail({
  to,
  inviteLink,
  teamName,
  inviterName,
}: {
  to: string;
  inviteLink: string;
  teamName: string;
  inviterName: string;
}) {
  // Try Resend API if available
  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
        to,
        subject: `You're invited to join ${teamName}`,
        html: `<p>Hello,</p><p>${inviterName} has invited you to join the team <b>${teamName}</b> on AssetPro.</p><p><a href="${inviteLink}">Accept your invitation</a></p><p>If you did not expect this, you can ignore this email.</p>`,
      }),
    });
    if (!res.ok) {
      throw new Error('Failed to send invitation email via Resend');
    }
    return true;
  }
  // Fallback: use nodemailer SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Dynamically import nodemailer only if needed
    const nodemailer = (await import('nodemailer')) as typeof nodemailerType;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'noreply@yourdomain.com',
      to,
      subject: `You're invited to join ${teamName}`,
      html: `<p>Hello,</p><p>${inviterName} has invited you to join the team <b>${teamName}</b> on AssetPro.</p><p><a href="${inviteLink}">Accept your invitation</a></p><p>If you did not expect this, you can ignore this email.</p>`,
    });
    return true;
  }
  throw new Error('No email provider configured');
} 