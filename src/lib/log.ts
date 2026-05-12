// Lightweight dev logger. Surfaces errors to the console in development only,
// so production builds stay quiet while we still see issues locally.
export const logDevError = (context: string, error: unknown): void => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, error);
  }
};
