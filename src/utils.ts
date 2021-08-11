import jwt from 'jsonwebtoken';

const APP_SECRET = 'GraphQL-is-aw3some';

function getUserId(authToken: string): number | null {
  try {
    const payload = jwt.verify(authToken, APP_SECRET);

    if (typeof payload === 'string') return null;

    const userId = payload.userId;

    if (typeof userId !== 'number') return userId;
  } catch (err) {}

  return null;
}

export { APP_SECRET, getUserId };

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
