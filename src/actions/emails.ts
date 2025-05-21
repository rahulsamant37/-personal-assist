'use server';

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

import { prisma } from '@/prisma';
import { auth } from '../../auth';
import { createRawEmail } from '@/features/email/utils';
import { revalidatePath } from 'next/cache';
import { EmailDraft } from '@/features/email/types';
import { Email } from '@/generated/prisma';

export const getEmails = async (userId: string) =>
  prisma.email.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

export const sendEmailUsingGmail = async (email: EmailDraft) => {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    throw new Error('User is not authenticated');
  }

  const Oauth = new OAuth2Client();
  Oauth.setCredentials({
    access_token: accessToken,
  });

  const gmail = google.gmail({ version: 'v1', auth: Oauth });

  const raw = createRawEmail(email);

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
      },
    });

    console.log('✅ Email sent successfully:', res.data);
    revalidatePath('/dashboard');

    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        '❌ Error sending email:',
        (error as { response?: { data?: string } })?.response?.data ||
          error.message
      );
    } else {
      console.error('❌ Error sending email:', error);
    }
    throw new Error('Failed to send email');
  }
};

export const createEmail = async (email: Email) =>
  prisma.email.create({ data: email });
