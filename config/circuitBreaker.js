const CircuitBreaker = require('opossum');

const options = {
  timeout: 3000, // Nëse shërbimi vonon mbi 3 sekonda, ndërpreje
  errorThresholdPercentage: 50, // Nëse 50% e kërkesave dështojnë, "hap qarkun"
  resetTimeout: 10000 // Provo të rilidhesh pas 10 sekondave
};

const createBreaker = (action, fallback) => {
  const breaker = new CircuitBreaker(action, options);
  breaker.fallback(fallback);
  
  breaker.on('open', () => console.log('⚠️ [Circuit Breaker] OPEN: Shërbimi është i bllokuar përkohësisht!'));
  breaker.on('halfOpen', () => console.log('🔍 [Circuit Breaker] HALF_OPEN: Po testohet rilidhja...'));
  breaker.on('close', () => console.log('✅ [Circuit Breaker] CLOSED: Shërbimi u rikthye në normalitet.'));

  return breaker;
};

module.exports = createBreaker;