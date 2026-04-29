const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000, // Nëse shërbimi s'përgjigjet për 3 sekonda, ndalo
  errorThresholdPercentage: 50, // Nëse 50% e kërkesave dështojnë, hap qarkun
  resetTimeout: 30000 // Provo të lidhesh përsëri pas 30 sekondave
};

const createBreaker = (action) => {
  const breaker = new CircuitBreaker(action, options);

  // Logimet në terminal që t'i tregosh profesoreshës që punon
  breaker.on('open', () => console.log('⚠️ [CB] Qarku u HAP! Shërbimi është në defekt.'));
  breaker.on('halfOpen', () => console.log('🔍 [CB] Qarku në test (Half-Open)...'));
  breaker.on('close', () => console.log('✅ [CB] Qarku u MBYLL! Shërbimi u rikthye.'));

  return breaker;
};

module.exports = createBreaker;