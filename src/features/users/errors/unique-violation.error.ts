export class UniqueViolationError extends Error {
  constructor(public readonly field?: string) {
    super('Unique constraint violation');
    this.name = 'UniqueViolationError';
  }
}
