import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '@devforge/database';
import { environment } from '../shared/env';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  baseURL: environment.NEXT_PUBLIC_APP_URL,
  secret: environment.BETTER_AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Enable later when email provider is set up
  },
  socialProviders: {
    google: {
      clientId: environment.GOOGLE_CLIENT_ID ?? '',
      clientSecret: environment.GOOGLE_CLIENT_SECRET ?? '',
      enabled: !!(environment.GOOGLE_CLIENT_ID && environment.GOOGLE_CLIENT_SECRET),
    },
  },
  trustedOrigins: [environment.NEXT_PUBLIC_APP_URL],
});

export type Session = typeof auth.$Infer.Session;
