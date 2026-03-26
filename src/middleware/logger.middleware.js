export default function logger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    console.log({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ip: req.ip,
      duration: `${duration}ms`,
    });
  });

  next();
}
