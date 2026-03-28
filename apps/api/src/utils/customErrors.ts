export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = "Resource not found") {
    super(message);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string = "Conflict") {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = "Forbidden") {
    super(message);
  }
}

export class BadRequestError extends DomainError {
  constructor(message: string = "Bad Request") {
    super(message);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = "Unauthorized") {
    super(message);
  }
}
