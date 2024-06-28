declare module 'lodash' {
    export function debounce<F extends (...args: any[]) => any>(
      func: F,
      wait?: number,
      options?: {
        leading?: boolean;
        maxWait?: number;
        trailing?: boolean;
      }
    ): F;
    // Add other lodash functions as needed
  }
