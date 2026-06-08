export const errorHandler = (err, req, res, next) => {
  // Always log errors to console — prevents silent failures
  console.error(`❌ [ErrorHandler] ${req.method} ${req.originalUrl}`);
  console.error(`   Message: ${err.message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(`   Stack: ${err.stack}`);
  }

  // Mongoose validation error → 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: messages.join(', '),
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }

  // Mongoose duplicate key error → 400
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `Duplicate value for field: ${field}`,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }

  // Mongoose bad ObjectId → 400
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
