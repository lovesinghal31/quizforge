import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from '@/lib/prisma'; // your prisma client instance
import { nextCookies } from 'better-auth/next-js';

export const auth = betterAuth({
  advanced: {
    database: {
      joins: true, // enable joins for relational data
    },
  },
  database: prismaAdapter(prisma, {
    provider: 'postgresql', // or "mysql", "sqlite", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});
