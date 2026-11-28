
import { Router, type RequestHandler, type RouterOptions } from 'express';
import { wrapAsync } from '../middleware/async.js';

export function createRouter(options?: RouterOptions): Router {
  const router = Router(options);

  for (const method of [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'use',
  ] as const) {
    const original = router[method].bind(router);

    (router as any)[method] = (...args: unknown[]) => {
      const wrappedArgs = args.map((arg) =>
        typeof arg === 'function'
          ? wrapAsync(arg as RequestHandler)
          : arg,
      );

      return Reflect.apply(original, router, wrappedArgs);
    };
  }

  return router;
}
