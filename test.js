const Redis = require('ioredis');
const redis = new Redis('redis://sangeetha:sangeethaRedis123*@redis-13154.c301.ap-south-1-1.ec2.redns.redis-cloud.com:13154');

redis.set('test', 'Hello Redis!', (err) => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('Connection successful!');
  }
  redis.quit();
});