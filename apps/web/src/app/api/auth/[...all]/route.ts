import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/server/auth/index';

export const { POST, GET } = toNextJsHandler(auth);
