const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source] || {});
  if (!result.success) {
    const issue = result.error.issues[0];
    return res.status(400).json({
      success: false,
      message: issue?.message || 'Invalid request.',
      field: issue?.path?.join('.') || null,
    });
  }
  req[source] = result.data;
  next();
};

module.exports = validate;
