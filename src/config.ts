// config.ts

export const SERVER_PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT) : 3000;
export const SECRETE_KEY = process.env.SECRETE_KEY || null;
