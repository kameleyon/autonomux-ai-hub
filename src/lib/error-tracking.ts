export function trackError(error: unknown, context?: string) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Autonomux Error]${context ? ` [${context}]` : ""}: ${message}`);
  // TODO: Replace with Sentry.captureException(error) when Sentry is added
}
