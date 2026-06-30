import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123456', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@finwise.com' },
    update: {},
    create: {
      email: 'demo@finwise.com',
      name: 'Demo Learner',
      username: 'DemoLearner',
      displayName: 'Demo Learner',
      passwordHash,
      level: 1,
      xp: 0,
      coins: 100,
      hearts: 5,
      streakCount: 0,
    },
  })
  console.log(`✅ Created demo user: ${user.email}`)

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@finwise.com' },
    update: {},
    create: {
      email: 'admin@finwise.com',
      name: 'Admin',
      username: 'Admin',
      displayName: 'Admin',
      passwordHash: adminHash,
      role: 'admin',
      level: 10,
      xp: 100000,
      coins: 9999,
      hearts: 5,
    },
  })
  console.log(`✅ Created admin user: ${admin.email}`)

  // Create modules and lessons
  const modulesData = [
    {
      title: 'Money Basics',
      description: 'Learn what money is and how it works',
      icon: '💰',
      color: '#58cc02',
      order: 1,
      xpReward: 50,
      coinReward: 10,
      lessons: [
        {
          title: 'What is Money?',
          description: 'Understand the concept of money',
          order: 1,
          xpReward: 20,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            introduction: 'Money is a tool that helps us trade, save, and plan.',
            questions: [
              {
                id: 'money-1',
                type: 'multiple_choice',
                question: 'What is the primary function of money?',
                options: ['Medium of exchange', 'A toy', 'Collectible item', 'Just paper'],
                correctAnswer: 'Medium of exchange',
                explanation: 'Money serves as a medium of exchange for goods and services.',
              },
              {
                id: 'money-2',
                type: 'multiple_choice',
                question: 'What makes modern money valuable?',
                options: ['Trust and backing', 'Its color', 'Its age', 'Its size'],
                correctAnswer: 'Trust and backing',
                explanation: 'Modern money (fiat) has value because people trust it.',
              },
            ],
          },
        },
        {
          title: 'Income vs Expenses',
          description: 'Earning and spending basics',
          order: 2,
          xpReward: 20,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'income-1',
                type: 'multiple_choice',
                question: 'What is income?',
                options: ['Money you earn', 'Money you spend', 'Money you save', 'Money you borrow'],
                correctAnswer: 'Money you earn',
                explanation: 'Income is money received from work or investments.',
              },
            ],
          },
        },
        {
          title: 'Needs vs Wants',
          description: 'Distinguish necessities from luxuries',
          order: 3,
          xpReward: 20,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'needs-1',
                type: 'multiple_choice',
                question: 'Which is a NEED?',
                options: ['Food', 'Video games', 'Designer shoes', 'Concert tickets'],
                correctAnswer: 'Food',
                explanation: 'Food is essential for survival.',
              },
            ],
          },
        },
        {
          title: 'Saving Fundamentals',
          description: 'Start building a saving habit',
          order: 4,
          xpReward: 25,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'save-1',
                type: 'multiple_choice',
                question: 'What is the 50/30/20 rule?',
                options: ['50% needs, 30% wants, 20% savings', '50% savings, 30% needs, 20% wants', 'Split everything equally', '50% wants, 30% savings, 20% needs'],
                correctAnswer: '50% needs, 30% wants, 20% savings',
                explanation: 'This rule helps balance spending and saving.',
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Budgeting',
      description: 'Master the art of budgeting',
      icon: '📊',
      color: '#1cb0f6',
      order: 2,
      xpReward: 60,
      coinReward: 12,
      lessons: [
        {
          title: 'Creating a Budget',
          description: 'Make your first budget',
          order: 1,
          xpReward: 25,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'budget-1',
                type: 'multiple_choice',
                question: 'What is a budget?',
                options: ['A plan for your money', 'A way to spend more', 'A bank account', 'A credit card'],
                correctAnswer: 'A plan for your money',
                explanation: 'A budget helps you plan spending and saving.',
              },
            ],
          },
        },
        {
          title: 'Tracking Spending',
          description: 'Know where your money goes',
          order: 2,
          xpReward: 20,
          coinReward: 5,
          lessonType: 'fill_blank',
          content: {
            questions: [
              {
                id: 'track-1',
                type: 'fill_blank',
                question: 'The money you earn from work is called _____.',
                options: ['income', 'salary', 'wages', 'pay'],
                correctAnswer: 'income',
                explanation: 'Income is money you earn from working.',
              },
            ],
          },
        },
        {
          title: 'Emergency Funds',
          description: 'Prepare for the unexpected',
          order: 3,
          xpReward: 25,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'emergency-1',
                type: 'multiple_choice',
                question: 'How much should an emergency fund cover?',
                options: ['3-6 months expenses', '1 week', '1 year', 'Not needed'],
                correctAnswer: '3-6 months expenses',
                explanation: 'Experts recommend 3-6 months of expenses saved.',
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Banking',
      description: 'Understanding banks and accounts',
      icon: '🏦',
      color: '#ce82ff',
      order: 3,
      xpReward: 55,
      coinReward: 10,
      lessons: [
        {
          title: 'Checking Accounts',
          description: 'Everyday banking basics',
          order: 1,
          xpReward: 20,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'checking-1',
                type: 'multiple_choice',
                question: 'What is a checking account for?',
                options: ['Daily transactions', 'Long-term savings', 'Investing', 'Retirement'],
                correctAnswer: 'Daily transactions',
                explanation: 'Checking accounts are for everyday use.',
              },
            ],
          },
        },
        {
          title: 'Savings Accounts',
          description: 'Grow your money safely',
          order: 2,
          xpReward: 20,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'savings-1',
                type: 'multiple_choice',
                question: 'What is interest on a savings account?',
                options: ['Money the bank pays you', 'A fee you pay', 'Free government money', 'A tax'],
                correctAnswer: 'Money the bank pays you',
                explanation: 'Interest is paid by the bank for keeping money with them.',
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Credit',
      description: 'Master credit scores and cards',
      icon: '💳',
      color: '#ff9600',
      order: 4,
      xpReward: 65,
      coinReward: 15,
      lessons: [
        {
          title: 'Credit Scores',
          description: 'Understand credit scores',
          order: 1,
          xpReward: 25,
          coinReward: 5,
          lessonType: 'match_terms',
          content: {
            questions: [
              {
                id: 'credit-1',
                type: 'match_terms',
                question: 'Match the terms:',
                matchPairs: [
                  { id: 'm1', term: 'Credit Score', definition: 'A number representing creditworthiness' },
                  { id: 'm2', term: 'APR', definition: 'Annual Percentage Rate' },
                ],
                correctAnswer: [],
                explanation: 'These terms are key to understanding credit.',
              },
            ],
          },
        },
        {
          title: 'Debt Management',
          description: 'Manage and reduce debt',
          order: 2,
          xpReward: 25,
          coinReward: 5,
          lessonType: 'scenario',
          content: {
            questions: [
              {
                id: 'debt-1',
                type: 'scenario',
                question: 'Your paycheck is $500. Rent: $200. Food: $100. How much remains?',
                scenario: {
                  description: 'You received your paycheck.',
                  data: { paycheck: 500, rent: 200, food: 100 },
                  question: 'How much is left?',
                },
                options: ['$200', '$100', '$150', '$50'],
                correctAnswer: '$200',
                explanation: '$500 - $200 - $100 = $200 remaining.',
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Investing',
      description: 'Start your investment journey',
      icon: '📈',
      color: '#ff4b4b',
      order: 5,
      xpReward: 75,
      coinReward: 15,
      lessons: [
        {
          title: 'Stocks & ETFs',
          description: 'Learn about stocks and ETFs',
          order: 1,
          xpReward: 25,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'stock-1',
                type: 'multiple_choice',
                question: 'What does buying a stock mean?',
                options: ['Partial ownership', 'Lending money', 'Buying a product', 'Paying a fee'],
                correctAnswer: 'Partial ownership',
                explanation: 'You become a partial owner of the company.',
              },
              {
                id: 'stock-2',
                type: 'multiple_choice',
                question: 'What is compound growth?',
                options: ['Earning returns on returns', 'Saving monthly', 'Paying debt', 'Making a budget'],
                correctAnswer: 'Earning returns on returns',
                explanation: 'Compound growth is earning returns on your returns.',
              },
            ],
          },
        },
        {
          title: 'Risk vs Reward',
          description: 'Understanding investment risk',
          order: 2,
          xpReward: 25,
          coinReward: 5,
          lessonType: 'scenario',
          content: {
            questions: [
              {
                id: 'risk-1',
                type: 'scenario',
                question: 'Which has highest potential return and risk?',
                scenario: {
                  description: 'You have $1,000 to invest.',
                  data: { savings: 1000, stocks: 1000, bonds: 1000 },
                  question: 'Highest potential growth?',
                },
                options: ['Stocks', 'Savings account', 'Government bonds', 'Under mattress'],
                correctAnswer: 'Stocks',
                explanation: 'Stocks historically offer highest long-term returns.',
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Taxes',
      description: 'Tax basics for beginners',
      icon: '🧾',
      color: '#58cc02',
      order: 6,
      xpReward: 50,
      coinReward: 10,
      lessons: [
        {
          title: 'Basic Taxes',
          description: 'What are taxes?',
          order: 1,
          xpReward: 20,
          coinReward: 5,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'tax-1',
                type: 'multiple_choice',
                question: 'Why do we pay taxes?',
                options: ['Fund public services', 'Make government rich', 'Punish workers', 'Optional donations'],
                correctAnswer: 'Fund public services',
                explanation: 'Taxes fund schools, roads, hospitals, and more.',
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Advanced Finance',
      description: 'Retirement and wealth building',
      icon: '🚀',
      color: '#ce82ff',
      order: 7,
      xpReward: 100,
      coinReward: 20,
      lessons: [
        {
          title: 'Retirement Accounts',
          description: 'Plan for retirement',
          order: 1,
          xpReward: 30,
          coinReward: 10,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'retire-1',
                type: 'multiple_choice',
                question: 'What is a 401(k)?',
                options: ['Employer retirement account', 'Savings account', 'Government pension', 'Stock index'],
                correctAnswer: 'Employer retirement account',
                explanation: 'A 401(k) is offered by employers for retirement savings.',
              },
            ],
          },
        },
        {
          title: 'Wealth Building',
          description: 'Long-term wealth strategies',
          order: 2,
          xpReward: 35,
          coinReward: 10,
          lessonType: 'multiple_choice',
          content: {
            questions: [
              {
                id: 'wealth-1',
                type: 'multiple_choice',
                question: 'Most important factor in building wealth?',
                options: ['Time and consistency', 'Getting lucky', 'High income', 'Winning lottery'],
                correctAnswer: 'Time and consistency',
                explanation: 'Consistent saving and investing over time builds wealth.',
              },
            ],
          },
        },
      ],
    },
  ]

  for (const modData of modulesData) {
    const { lessons, ...moduleFields } = modData
    const mod = await prisma.module.upsert({
      where: { id: modData.title.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        id: modData.title.toLowerCase().replace(/\s+/g, '-'),
        ...moduleFields,
      },
    })

    for (const lessonData of lessons) {
      await prisma.lesson.upsert({
        where: { id: `${mod.id}-${lessonData.order}` },
        update: {},
        create: {
          id: `${mod.id}-${lessonData.order}`,
          moduleId: mod.id,
          ...lessonData,
          content: JSON.stringify(lessonData.content),
        },
      })
    }
    console.log(`✅ Created module: ${modData.title} (${lessons.length} lessons)`)
  }

  // Create achievements
  const achievements = [
    { key: 'first_lesson', title: 'First Steps', description: 'Complete your first lesson', icon: '🎯', xpReward: 100, coinReward: 20 },
    { key: 'streak_7', title: 'Week Warrior', description: '7-day streak', icon: '🔥', xpReward: 200, coinReward: 50 },
    { key: 'streak_30', title: 'Monthly Master', description: '30-day streak', icon: '💪', xpReward: 500, coinReward: 100 },
    { key: 'ten_lessons', title: 'Dedicated Learner', description: 'Complete 10 lessons', icon: '📚', xpReward: 150, coinReward: 30 },
    { key: 'xp_1000', title: 'Century Club', description: 'Earn 1,000 XP', icon: '⭐', xpReward: 300, coinReward: 75 },
    { key: 'xp_10000', title: 'XP Champion', description: 'Earn 10,000 XP', icon: '🏆', xpReward: 1000, coinReward: 200 },
    { key: 'perfect_quiz', title: 'Perfect Score', description: '100% on any quiz', icon: '💯', xpReward: 250, coinReward: 50 },
    { key: 'module_complete', title: 'Module Master', description: 'Complete an entire module', icon: '🎓', xpReward: 300, coinReward: 60 },
    { key: 'budget_master', title: 'Budget Master', description: 'Complete the budgeting module', icon: '📊', xpReward: 200, coinReward: 40 },
    { key: 'investing_beginner', title: 'Investing Beginner', description: 'Complete the investing module', icon: '📈', xpReward: 250, coinReward: 50 },
    { key: 'all_modules', title: 'FinWise Graduate', description: 'Complete all modules', icon: '👑', xpReward: 2000, coinReward: 500 },
    { key: 'friend_referee', title: 'Social Butterfly', description: 'Refer a friend', icon: '🦋', xpReward: 150, coinReward: 100 },
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      update: {},
      create: achievement,
    })
  }
  console.log(`✅ Created ${achievements.length} achievements`)

  // Create daily challenges
  const challenges = [
    { title: 'Complete 3 Lessons', description: 'Finish any 3 lessons today', type: 'complete_lessons', target: 3, xpReward: 50, coinReward: 10 },
    { title: 'Earn 100 XP', description: 'Accumulate 100 XP from lessons', type: 'earn_xp', target: 100, xpReward: 75, coinReward: 15 },
    { title: 'Perfect Quiz', description: 'Get 100% on any quiz', type: 'perfect_quiz', target: 1, xpReward: 100, coinReward: 20 },
  ]

  for (const challenge of challenges) {
    await prisma.dailyChallenge.create({
      data: challenge,
    })
  }
  console.log(`✅ Created ${challenges.length} daily challenges`)

  // Create store items
  const storeItems = [
    { name: 'Gold Avatar Frame', description: 'Premium gold frame for your avatar', type: 'avatar', price: 500 },
    { name: 'Dark Theme', description: 'Exclusive dark theme variant', type: 'theme', price: 300 },
    { name: 'Streak Freeze', description: 'Protect your streak for one day', type: 'freeze', price: 200 },
    { name: '2x XP Boost', description: 'Double XP for 1 hour', type: 'boost', price: 400 },
    { name: 'Diamond Avatar', description: 'Shiny diamond avatar effect', type: 'avatar', price: 1000 },
    { name: 'Neon Theme', description: 'Vibrant neon color theme', type: 'theme', price: 500 },
  ]

  for (const item of storeItems) {
    await prisma.storeItem.create({
      data: item,
    })
  }
  console.log(`✅ Created ${storeItems.length} store items`)

  console.log('\n🎉 Seeding complete!')
  console.log('📧 Demo account: demo@finwise.com / demo123456')
  console.log('📧 Admin account: admin@finwise.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
