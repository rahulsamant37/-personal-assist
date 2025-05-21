'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { createId } from '@paralleldrive/cuid2';
import { useRouter } from 'next/navigation';

import { EmailDraft as EmailDraftType } from '@/features/email/types';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Calendar, Clock, Mail, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  CalendarEvent,
  Email,
  Message,
  Reminder,
  User,
} from '@/generated/prisma';
import { ChatMessage } from '@/components/chat-message';
import { CalendarEventSchedule } from '@/features/calendarEvent/types';
import {
  generateEventScheduledResponse,
  parseCalendarEvent,
} from '@/features/calendarEvent/utils';
import { CalendarEventCard } from '@/components/calendar-event-card';
import { createMessageForCurrentUser } from '@/features/messages/messages-helpers.server';
import {
  createCalendarEvent,
  scheduleGoogleCalendarEvent,
} from '@/actions/calendar';
import { CalendarEventList } from '@/components/calendar-event-list';
import { EmailList } from '@/components/email-list';
import { parseEmailDraft } from '@/features/email/utils';
import { EmailDraft } from '@/components/email-draft';
import { createEmail, sendEmailUsingGmail } from '@/actions/emails';
import { ReminderCard } from '@/components/reminder-card';
import { parseReminder } from '@/features/reminder/utils';
import { ReminderDraftCard } from '@/components/reminder-draft-card';
import { ReminderSchedule } from '@/features/reminder/type';
import { createReminder, scheduleReminder } from '@/actions/reminder';
import { parseISO } from 'date-fns';

const DashboardPageComponent = ({
  messages,
  calendarEvents,
  user,
  emails,
  reminders,
}: {
  messages: Message[];
  calendarEvents: CalendarEvent[];
  user: User;
  emails: Email[];
  reminders: Reminder[];
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [calendarEvent, setCalendarEvent] = useState<CalendarEventSchedule>({
    title: '',
    location: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    attendees: [],
  });
  const [emailDraft, setEmailDraft] = useState({
    to: '',
    subject: '',
    body: '',
  });
  const [reminderDraft, setReminderDraft] = useState({
    summary: '',
    description: '',
    start: '',
    end: '',
  });

  const [showCalendarEvent, setShowCalendarEvent] = useState(false);
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const [showReminder, setShowReminder] = useState(false);

  const router = useRouter();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input.trim()) {
      processMessage(input.trim());
      setInput('');
    }
  };

  const processMessage = async (message: string) => {
    setInput('');

    if (message.toLowerCase().includes('remind me')) {
      return processReminder(message);
    }

    if (
      message.toLowerCase().includes('draft an email') ||
      message.toLowerCase().includes('send an email')
    ) {
      return processEmailDraft(message);
    }

    if (
      message.toLowerCase().includes('add meeting') ||
      message.toLowerCase().includes('schedule')
    ) {
      return processCalendarEvent(message);
    }
  };

  const processCalendarEvent = (message: string) => {
    const event = parseCalendarEvent(message);
    setCalendarEvent(event);
    setShowCalendarEvent(true);
  };

  const processEmailDraft = (message: string): void => {
    const emailDraft = parseEmailDraft(message);
    setEmailDraft(emailDraft);
    setShowEmailDraft(true);
  };

  const processReminder = (message: string): void => {
    const reminder = parseReminder(message);
    setReminderDraft(reminder);
    setShowReminder(true);
  };

  const onSaveCalendarEvent = async (eventData: CalendarEventSchedule) => {
    // PROMPT example: Save the calendar event
    // Schedule a meeting titled "Tech Sync with Team"
    // starting at June 13, 2025 4:00 PM
    // ending at June 13, 2025 5:00 PM
    // located at Zoom
    // with description "Discuss sprint goals and blockers."
    setShowCalendarEvent(false);

    const optimisticId = createId();
    const attendees = Array.from(new Set([...eventData.attendees, user.email]));

    setLocalMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        id: optimisticId,
        userId: user.id,
        content: generateEventScheduledResponse(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    try {
      await Promise.all([
        createMessageForCurrentUser({
          role: 'assistant',
          message: generateEventScheduledResponse(),
        }),
        scheduleGoogleCalendarEvent({
          ...eventData,
          attendees,
        }),
        createCalendarEvent({
          ...eventData,
          userId: user.id,
          attendees,
          id: createId(),
          startDate: new Date(eventData.startDate),
          endDate: new Date(eventData.endDate),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);
      router.refresh();
    } catch (error) {
      console.error('Failed to save calendar event:', error);
      setLocalMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticId && msg.role === 'assistant'
            ? {
                ...msg,
                content:
                  'Something went wrong while scheduling your event. Please try again.',
              }
            : msg
        )
      );
    }
  };

  const onSendEmail = async (emailDraft: EmailDraftType) => {
    // PROMPT example:
    // Send an email to johndoe@gmail.com with subject "Meeting Reminder" and body "Hi Bright, just reminding you that our meeting is tomorrow at 10 AM. Let me know if you need anything."

    setShowEmailDraft(false);
    const optimisticId = createId();

    setLocalMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        id: optimisticId,
        userId: user.id,
        content: `Email sent to ${emailDraft.to} with subject "${emailDraft.subject}"`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    try {
      await Promise.all([
        createMessageForCurrentUser({
          role: 'assistant',
          message: `Email sent to ${emailDraft.to} with subject "${emailDraft.subject}"`,
        }),
        sendEmailUsingGmail(emailDraft),
        createEmail({
          ...emailDraft,
          userId: user.id,
          id: createId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);
    } catch (error) {
      console.error('Failed to send email:', error);
      setLocalMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticId && msg.role === 'assistant'
            ? {
                ...msg,
                content:
                  'Something went wrong while sending your email. Please try again.',
              }
            : msg
        )
      );
    }
  };

  const onSaveReminder = async (reminderData: ReminderSchedule) => {
    // PROMPT example:
    // Remind me: titled "Doctor Appointment" from 2024-05-12T15:00:00Z to 2024-05-12T16:00:00Z with description "Annual check-up with Dr. Smith at the clinic." and notify john@example.com and jane@example.com.

    setShowReminder(false);
    const optimisticId = createId();
    setLocalMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        id: optimisticId,
        userId: user.id,
        content: `Reminder set for ${reminderData.summary} from ${reminderData.start} to ${reminderData.end}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    try {
      await Promise.all([
        createMessageForCurrentUser({
          role: 'assistant',
          message: `Reminder set for ${reminderData.summary} from ${reminderData.start} to ${reminderData.end}`,
        }),
        scheduleReminder(reminderData),
        createReminder({
          ...reminderData,
          start: parseISO(reminderData.start),
          end: parseISO(reminderData.end),
          userId: user.id,
          id: createId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ]);
    } catch (error) {
      console.error('Failed to save reminder:', error);
      setLocalMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticId && msg.role === 'assistant'
            ? {
                ...msg,
                content:
                  'Something went wrong while saving your reminder. Please try again.',
              }
            : msg
        )
      );
    }
  };

  return (
    <div className='flex h-screen w-full bg-background'>
      {/* Sidebar */}
      <DashboardSidebar />

      <div className='flex flex-col w-full flex-1 overflow-hidden'>
        {/* DashboardHeader : h-[56px] h-14 */}
        <DashboardHeader />

        {/* Tabs Container */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='flex flex-col flex-1 overflow-hidden'
        >
          <TabsList className='sticky top-14 z-10 w-full bg-white border-b h-12 p-2'>
            <TabsTrigger value='chat' className='flex items-center gap-2'>
              <Bot className='size-4' /> Chat
            </TabsTrigger>
            <TabsTrigger value='calendar' className='flex items-center gap-2'>
              <Calendar className='size-4' /> Calendar
            </TabsTrigger>
            <TabsTrigger value='reminders' className='flex items-center gap-2'>
              <Clock className='size-4' /> Reminders
            </TabsTrigger>
            <TabsTrigger value='gmail' className='flex items-center gap-2'>
              <Mail className='size-4' /> Gmail
            </TabsTrigger>
          </TabsList>
          <div className='flex-1 overflow-y-auto px-4 pb-4 pt-14 mb-32'>
            <TabsContent value='chat' className='space-y-4'>
              <div className='flex-1 space-y-4 pb-4'>
                {localMessages.map(message => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
              {showCalendarEvent && (
                <CalendarEventCard
                  initialData={calendarEvent}
                  onCancel={() => setShowCalendarEvent(false)}
                  onSave={onSaveCalendarEvent}
                />
              )}
              {showEmailDraft && (
                <EmailDraft
                  draft={emailDraft}
                  setDraft={setEmailDraft}
                  onClose={() => setShowEmailDraft(false)}
                  onSend={onSendEmail}
                />
              )}
              {showReminder && (
                <ReminderDraftCard
                  initialData={reminderDraft}
                  onCancel={() => setShowReminder(false)}
                  onSave={onSaveReminder}
                />
              )}
            </TabsContent>
            <TabsContent value='calendar' className='space-y-4'>
              <CalendarEventList calendarEvents={calendarEvents} />
            </TabsContent>
            <TabsContent value='reminders' className='space-y-4'>
              <ReminderCard reminders={reminders} />
            </TabsContent>
            <TabsContent value='gmail' className='space-y-4'>
              <EmailList emails={emails} />
            </TabsContent>
          </div>

          <div className='fixed w-full md:w-[calc(100%-var(--sidebar-width))] left-0 md:left-[var(--sidebar-width)] bottom-0 bg-white p-4 border-t'>
            <form
              onSubmit={handleSubmit}
              className='flex flex-col sm:flex-row sm:items-end gap-4'
            >
              {/* Message Input */}
              <div className='relative flex-1 w-full'>
                <Textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder='Type your message...'
                  className='min-h-[80px] pr-10 resize-none'
                />
              </div>

              {/* Send button */}
              <div className='flex items-center gap-2 w-full sm:w-auto'>
                <Button type='submit' className='w-fit sm:w-auto'>
                  <Send className='h-4 w-4 mr-2' />
                  Send
                </Button>
              </div>
            </form>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPageComponent;
