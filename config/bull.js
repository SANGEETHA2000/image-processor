const Bull = require('bull');

const redisURL = process.env.REDIS_URL;

exports.imageProcessingQueue = new Bull('image-processing', {
  redis: redisURL,
  prefix: 'bull',
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: 100
  }
});