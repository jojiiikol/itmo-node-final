export class ApplicationError extends Error {}

export class AuthenticationError extends ApplicationError {}

export class NotFoundError extends ApplicationError {}

export class ValidationError extends ApplicationError {}
