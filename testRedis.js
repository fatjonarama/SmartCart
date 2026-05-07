require('dotenv').config();
const { redisClient, connectRedis } = require('./config/redis');

const testRedis = async () => {
    await connectRedis();

    // Prit lidhjen
    await new Promise(r => setTimeout(r, 1000));

    console.log('\n🧪 Duke testuar Redis...\n');

    // 1. SET
    await redisClient.set('test:key', 'SmartCart Redis punon!');
    console.log('✅ SET - u ruajt');

    // 2. GET
    const value = await redisClient.get('test:key');
    console.log('✅ GET -', value);

    // 3. SETEX me TTL
    await redisClient.setEx('test:ttl', 10, 'Fshihet pas 10 sekondave');
    console.log('✅ SETEX - TTL 10s');

    // 4. TTL mbetur
    const ttl = await redisClient.ttl('test:ttl');
    console.log('✅ TTL mbetur:', ttl, 'sekonda');

    // 5. INCR (për rate limiting)
    await redisClient.set('test:counter', 0);
    await redisClient.incr('test:counter');
    await redisClient.incr('test:counter');
    const counter = await redisClient.get('test:counter');
    console.log('✅ INCR counter:', counter);

    // 6. DEL
    await redisClient.del('test:key');
    const deleted = await redisClient.get('test:key');
    console.log('✅ DEL - vlera pas fshirjes:', deleted);

    // 7. JSON object
    const product = { id: 1, name: 'Laptop', price: 999 };
    await redisClient.setEx('test:product', 300, JSON.stringify(product));
    const cached = await redisClient.get('test:product');
    console.log('✅ JSON cache:', JSON.parse(cached));

    console.log('\n🎉 Të gjitha testet kaluan!\n');
    process.exit(0);
};

testRedis().catch(err => {
    console.error('❌ Test dështoi:', err.message);
    process.exit(1);
});