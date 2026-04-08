// Vercel Serverless Function entrypoint
const { app } = require('../packages/api/dist/main');

module.exports = app;
