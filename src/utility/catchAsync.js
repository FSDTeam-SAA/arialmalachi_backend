import { createRequire } from 'module';

const require = createRequire(import.meta.url);



const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default catchAsync;
