export const validate = (schema, source = 'body') => (req, res, next) => {
  const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
  const result = schema.safeParse(data);
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: result.error.flatten(),
    });
  }
  if (source === 'body') req.body = result.data;
  else if (source === 'query') req.validatedQuery = result.data;
  else req.params = result.data;
  next();
};
