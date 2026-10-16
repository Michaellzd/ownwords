// Stable codes let the UI translate errors without exposing provider messages.
export class UserError extends Error {
  constructor(code, params = {}) {
    super(code);
    this.name = 'UserError';
    this.code = code;
    this.params = params;
  }
}
