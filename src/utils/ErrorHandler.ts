/**
 * Centralized error handling and recovery system
 */

export interface ErrorContext {
  component: string;
  action: string;
  error: Error;
  metadata?: Record<string, any>;
}

export class ErrorHandler {
  private static errors: ErrorContext[] = [];
  private static maxErrors = 50;

  /**
   * Log an error with context
   */
  static logError(context: ErrorContext): void {
    console.error(`[${context.component}] ${context.action} failed:`, context.error);
    if (context.metadata) {
      console.error('Metadata:', context.metadata);
    }

    // Store error
    this.errors.push(context);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  /**
   * Execute a function with error handling
   */
  static async withErrorHandling<T>(
    component: string,
    action: string,
    fn: () => T | Promise<T>,
    fallback: T,
    metadata?: Record<string, any>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.logError({
        component,
        action,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata,
      });
      return fallback;
    }
  }

  /**
   * Execute a function with error handling (sync version)
   */
  static withErrorHandlingSync<T>(
    component: string,
    action: string,
    fn: () => T,
    fallback: T,
    metadata?: Record<string, any>
  ): T {
    try {
      return fn();
    } catch (error) {
      this.logError({
        component,
        action,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata,
      });
      return fallback;
    }
  }

  /**
   * Get all logged errors
   */
  static getErrors(): ErrorContext[] {
    return [...this.errors];
  }

  /**
   * Clear error log
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Check if localStorage is available
   */
  static isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Safe localStorage get with fallback
   */
  static getLocalStorage(key: string, fallback: string | null = null): string | null {
    return this.withErrorHandlingSync(
      'ErrorHandler',
      'getLocalStorage',
      () => localStorage.getItem(key),
      fallback,
      { key }
    );
  }

  /**
   * Safe localStorage set
   */
  static setLocalStorage(key: string, value: string): boolean {
    return this.withErrorHandlingSync(
      'ErrorHandler',
      'setLocalStorage',
      () => {
        localStorage.setItem(key, value);
        return true;
      },
      false,
      { key }
    );
  }

  /**
   * Validate that required fields exist in an object
   */
  static validateRequired<T extends Record<string, any>>(
    obj: T,
    requiredFields: (keyof T)[],
    componentName: string
  ): boolean {
    const missing = requiredFields.filter(field => {
      const value = obj[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      this.logError({
        component: componentName,
        action: 'validateRequired',
        error: new Error(`Missing required fields: ${missing.join(', ')}`),
        metadata: { obj, missing },
      });
      return false;
    }

    return true;
  }
}

/**
 * In-memory fallback storage when localStorage is unavailable
 */
export class MemoryStorage {
  private static data: Map<string, string> = new Map();

  static setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  static getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  static removeItem(key: string): void {
    this.data.delete(key);
  }

  static clear(): void {
    this.data.clear();
  }
}
