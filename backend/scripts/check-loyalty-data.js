const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ override: true });

async function checkLoyaltyData() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Checking loyalty data in Supabase...');
    
    // Check loyalty tiers
    const tiers = await prisma.loyaltyTier.findMany({
      orderBy: { min_points: 'asc' }
    });
    console.log(`📊 Found ${tiers.length} loyalty tiers:`);
    tiers.forEach(tier => {
      console.log(`  - ${tier.name}: ${tier.min_points}+ points, ${tier.discount_percent}% discount, x${tier.points_multiplier} multiplier`);
    });
    
    // Check loyalty rewards
    const rewards = await prisma.loyaltyReward.findMany({
      where: { is_active: true },
      orderBy: { points_cost: 'asc' }
    });
    console.log(`\n🎁 Found ${rewards.length} active rewards:`);
    rewards.forEach(reward => {
      console.log(`  - ${reward.name}: ${reward.points_cost} points (${reward.reward_type})`);
    });
    
    // Check loyalty accounts
    const accounts = await prisma.loyaltyAccount.findMany({
      include: { tier: true, user: { select: { email: true } } }
    });
    console.log(`\n👥 Found ${accounts.length} loyalty accounts:`);
    accounts.forEach(account => {
      console.log(`  - User ${account.user.email}: ${account.points_balance} points (${account.tier.name})`);
    });
    
    // Check loyalty transactions
    const transactions = await prisma.loyaltyTransaction.findMany({
      take: 5,
      orderBy: { created_at: 'desc' }
    });
    console.log(`\n📋 Found ${transactions.length > 0 ? 'recent' : 'no'} transactions`);
    
    return {
      tiersCount: tiers.length,
      rewardsCount: rewards.length,
      accountsCount: accounts.length,
      transactionsCount: transactions.length
    };
    
  } catch (error) {
    console.error('❌ Error checking loyalty data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkLoyaltyData();
