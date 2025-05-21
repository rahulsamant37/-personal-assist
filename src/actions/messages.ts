'use server';

import { prisma } from '@/prisma';

// CREATE
export const createAssistantDefaultMessage = async (userId: string) =>
  prisma.message.create({
    data: {
      content: "Hello! I'm your assistant. How can I help you today?",
      role: 'assistant',
      userId,
    },
  });

export const createMessage = async ({
  role,
  userId,
  content,
}: {
  role: 'user' | 'assistant';
  userId: string;
  content: string;
}) =>
  prisma.message.create({
    data: {
      content,
      role,
      userId,
    },
  });

// READ
export const getMessages = async (userId: string) =>
  prisma.message.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
