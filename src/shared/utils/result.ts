// ============================================================
// 溢彩 Production OS — Result 模式（Either monad）
// ============================================================

export type Result<T, E = Error> = Success<T, E> | Failure<T, E>;

export class Success<T, E = Error> {
  readonly kind = 'success' as const;
  constructor(public readonly value: T) {}

  isSuccess(): this is Success<T, E> { return true; }
  isFailure(): this is Failure<T, E> { return false; }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Success(fn(this.value));
  }

  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  getOrElse(_default: T): T { return this.value; }
  getOrThrow(): T { return this.value; }
}

export class Failure<T, E = Error> {
  readonly kind = 'failure' as const;
  constructor(public readonly error: E) {}

  isSuccess(): this is Success<T, E> { return false; }
  isFailure(): this is Failure<T, E> { return true; }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Failure<U, E>(this.error);
  }

  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Failure<U, E>(this.error);
  }

  getOrElse(defaultVal: T): T { return defaultVal; }
  getOrThrow(): T { throw this.error; }
}

export const success = <T, E = Error>(value: T): Result<T, E> => new Success<T, E>(value);
export const failure = <T, E = Error>(error: E): Result<T, E> => new Failure<T, E>(error);
