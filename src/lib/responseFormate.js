export const generateResponse = (res, statusCode,status, message, data) => {
  if (res.headersSent) return;
  res.status(statusCode).json({status, message, data });
};
