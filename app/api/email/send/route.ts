import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { isResendConfigured, sendEmailWithResend } from '@/lib/resend';

type SendEmailRequest = {
  subject?: string;
  html?: string;
  text?: string;
  replyTo?: string;
};

export async function POST(request: Request) {
  try {
    if (!isResendConfigured()) {
      return NextResponse.json(
        { error: 'Transactional email is not configured yet' },
        { status: 503 },
      );
    }

    const { userId } = await auth();
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
    if (!userId || !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabase = await createClient();

    const body = (await request.json()) as SendEmailRequest;
    const subject = body.subject?.trim();
    const html = body.html?.trim();
    const text = body.text?.trim();
    const replyTo = body.replyTo?.trim();

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    if (!html && !text) {
      return NextResponse.json(
        { error: 'Either html or text is required' },
        { status: 400 },
      );
    }

    const emailId = await sendEmailWithResend({
      to: userEmail,
      subject,
      html,
      text,
      replyTo,
    });

    return NextResponse.json({ success: true, emailId });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 },
    );
  }
}
