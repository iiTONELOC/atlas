export class EntityValidationError extends Error {
  constructor(
    public readonly modelName: string,
    public readonly errors: Record<string, {constraints: string[]; messages: string[]}>,
  ) {
    const errorSummary = Object.entries(errors)
      .map(([prop, {messages}]) => `${prop}: ${messages.join(', ')}`)
      .join('; ');

    super(`Validation failed on ${modelName}: ${errorSummary}`);
    this.name = 'EntityValidationError';
  }
}

export class RateLimitExceededError extends Error {
  constructor(
    public readonly scope: string,
    public readonly key: string,
    public readonly blockedUntil: Date,
  ) {
    super(`Rate limit exceeded for ${scope}:${key} until ${blockedUntil.toISOString()}`);
    this.name = 'RateLimitExceededError';
  }
}
