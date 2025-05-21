'use server';

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

import { ReminderSchedule } from '@/features/reminder/type';
import { prisma } from '@/prisma';
import { auth } from '../../auth';
import { toReminderEventBody } from '@/features/reminder/utils';
import { Reminder } from '@/generated/prisma';

export const getReminders = async (userId: string) =>
  prisma.reminder.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

export const scheduleReminder = async (reminder: ReminderSchedule) => {
  const session = await auth();
  const accessToken = session?.accessToken;

  if (!accessToken) {
    throw new Error('Unauthorized');
  }

  const OAuth = new OAuth2Client();

  OAuth.setCredentials({
    access_token: accessToken,
  });

  const calendar = google.calendar({ version: 'v3', auth: OAuth });

  const requestBody = toReminderEventBody(reminder);

  try {
    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody,
    });

    console.log('Reminder scheduled:', data);
    return data;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    throw new Error('Failed to schedule reminder');
  }
};

export const createReminder = async (reminder: Reminder) =>
  prisma.reminder.create({
    data: reminder,
  });
