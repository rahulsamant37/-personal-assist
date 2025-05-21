'use server';

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

import { CalendarEventSchedule } from '@/features/calendarEvent/types';
import { prisma } from '@/prisma';
import { auth } from '../../auth';
import { toGoogleEventRequestBody } from '@/features/calendarEvent/utils';
import { CalendarEvent } from '@/generated/prisma';

export const getCalendarEvents = async (userId: string) =>
  prisma.calendarEvent.findMany({
    where: {
      userId,
    },
    orderBy: {
      startDate: 'asc',
    },
  });

export const scheduleGoogleCalendarEvent = async (
  eventDetails: CalendarEventSchedule
) => {
  const session = await auth();
  const accessToken = session?.accessToken as string;

  if (!accessToken) throw new Error('No access token found in session');

  const OAuth = new OAuth2Client();
  OAuth.setCredentials({
    access_token: accessToken,
  });
  const calendar = google.calendar({ version: 'v3', auth: OAuth });

  const requestBody = toGoogleEventRequestBody(eventDetails);

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody,
      sendUpdates: 'all',
      sendNotifications: true,
    });

    console.log('Event created:', response.data.htmlLink);
    return response.data;
  } catch (error) {
    console.error('Error scheduling event:', error);
    throw new Error('Failed to schedule event');
  }
};

export const createCalendarEvent = async (eventDetails: CalendarEvent) =>
  prisma.calendarEvent.create({
    data: eventDetails,
  });
