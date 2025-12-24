/**
 * Initialize loyalty system with default tiers and rewards
 * Run this script once to set up the loyalty system
 */

const loyaltyService = require('../services/loyalty.service');

async function initializeLoyaltySystem() {
  try {
    console.log('🚀 Initializing loyalty system...');
    
    // Initialize default tiers
    console.log('📊 Setting up loyalty tiers...');
    await loyaltyService.initializeDefaultTiers();
    
    // Initialize default rewards
    console.log('🎁 Setting up loyalty rewards...');
    await loyaltyService.initializeDefaultRewards();
    
    console.log('✅ Loyalty system initialized successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('- 4 loyalty tiers created (Bronze, Argent, Or, Platine)');
    console.log('- 6 default rewards created');
    console.log('- System ready for use');
    
  } catch (error) {
    console.error('❌ Failed to initialize loyalty system:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeLoyaltySystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { initializeLoyaltySystem };
