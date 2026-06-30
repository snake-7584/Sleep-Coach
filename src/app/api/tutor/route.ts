import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getContent, getCurrencyInfo } from '@/lib/content/registry'


function findRelevantContent(question: string, currency: string) {
  const content = getContent(currency)
  const currencyInfo = getCurrencyInfo(currency)
  const lower = question.toLowerCase()
  const results: { module: string; text: string }[] = []

  for (const mod of content.modules) {
    for (const lesson of mod.lessons) {
      const intro = lesson.content.introduction?.toLowerCase() || ''
      const summary = lesson.content.summary?.toLowerCase() || ''
      const tips = lesson.content.tips?.join(' ').toLowerCase() || ''
      const searchText = `${mod.title} ${lesson.title} ${intro} ${summary} ${tips}`

      const keywords = lower.split(' ').filter(w => w.length > 3)
      const matchCount = keywords.filter(k => searchText.includes(k)).length

      if (matchCount > 1 || searchText.includes(lower)) {
        results.push({
          module: `${mod.title} > ${lesson.title}`,
          text: lesson.content.summary || lesson.content.introduction || '',
        })
      }
    }
  }

  return { results, content, currencyInfo }
}

function getGenericAIResponse(question: string, currency: string): string {
  const { results, content, currencyInfo } = findRelevantContent(question, currency)
  const { symbol, name } = currencyInfo

  if (results.length > 0) {
    const relevant = results.slice(0, 2)
    const sourceInfo = relevant.map(r => `• From **${r.module}**: ${r.text}`).join('\n\n')
    return `Great question! Here's what I found based on the ${name} curriculum:\n\n${sourceInfo}\n\nWant to dive deeper? Try the related lesson in the Learning Path!`
  }

  const lower = question.toLowerCase()

  if (lower.includes('save') || lower.includes('saving')) {
    return `Saving is the foundation of financial health! Start by paying yourself first — set aside a portion of any money you receive before you spend it. Even ${symbol}5 a day adds up to ${symbol}1,825 in a year! Try the 50/30/20 rule: 50% for needs, 30% for wants, 20% for savings. In the ${name} curriculum, check out the "Saving Fundamentals" lesson for details specific to ${name}.`
  }

  if (lower.includes('bank') || lower.includes('account')) {
    return `Banks are like secure houses for your money. A checking account (or savings account, depending on your country) is for daily spending, while a savings account is for growing your money. In the ${name} system, our Banking module covers everything you need to know about accounts in ${currencyInfo.code}, including fees, interest rates, and how to choose the right bank.`
  }

  if (lower.includes('debt') || lower.includes('loan')) {
    return `Not all debt is bad! Good debt (like student loans or mortgages) can help build your future. Bad debt (like high-interest credit card debt) can hold you back. The key is understanding the difference and having a plan. Our Credit module in the ${name} curriculum covers debt management, credit scores, and how to borrow wisely in ${currencyInfo.code}.`
  }

  if (lower.includes('budget')) {
    return `Budgeting is your financial GPS! The 50/30/20 rule is a great starting point: 50% of your income for needs, 30% for wants, and 20% for savings. Our Budgeting module in the ${name} curriculum covers zero-based budgeting, the envelope system, and how to track every ${symbol} effectively. Start with tracking one week of expenses — you'll learn a lot!`
  }

  if (lower.includes('invest') || lower.includes('stock') || lower.includes('return')) {
    return `Investing means putting your money to work so it grows over time. The power of compound interest means even small amounts add up significantly. Our Investing module covers stocks, bonds, risk vs reward, and how to start investing in ${currencyInfo.code}. Remember: time in the market beats timing the market!`
  }

  if (lower.includes('credit') || lower.includes('score') || lower.includes('cibil')) {
    return `Your credit score is your financial reputation. A higher score means better interest rates and more options. Our Credit module in the ${name} curriculum covers everything from payment history to credit utilization, with examples in ${currencyInfo.code}. The most important factor? Always pay your bills on time!`
  }

  if (lower.includes('tax')) {
    return `Taxes fund public services like schools, roads, and healthcare. The amount you pay depends on your income bracket and location. Our Taxes module covers the basics of how taxes work, deductions, and filing — tailored to the ${name} system. Remember: paying taxes means you're earning!`
  }

  if (lower.includes('emergency') || lower.includes('fund')) {
    return `An emergency fund is your financial safety net! Aim for 3-6 months of essential expenses. Start small — even ${symbol}500-${symbol}1,000 makes a difference. Our Emergency Funds lesson in the ${name} curriculum has specific examples and targets for ${currencyInfo.code} to help you build yours.`
  }

  const topics = content.modules.map(m => `"${m.title}"`).join(', ')
  return `That's a great question! I want to make sure you get the best answer. Here are some topics I can help with: ${topics}. Try asking about one of these, or check out the Learning Path for structured lessons in ${name}!`
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { question, currency } = await request.json() as { question: string; currency?: string }
  if (!question?.trim()) {
    return NextResponse.json({ error: 'Question is required' }, { status: 400 })
  }

  const userCurrency = currency || session?.user?.currency || 'USD'

  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a financial literacy tutor for the FinWise app. The user's currency is ${currency || 'USD'}. Answer questions about personal finance using examples in ${currency || 'USD'}. Keep responses friendly, educational, and easy to understand for beginners. Include specific amounts in the user's currency when relevant. Do not give personalized financial advice.`,
            },
            { role: 'user', content: question },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })
      if (!res.ok) throw new Error('OpenAI API error')
      const data = await res.json() as { choices: { message: { content: string } }[] }
      const reply = data.choices?.[0]?.message?.content
      if (reply) {
        return NextResponse.json({ reply })
      }
    } catch {
      // fallback to generic response
    }
  }

  const reply = getGenericAIResponse(question, userCurrency)
  return NextResponse.json({ reply })
}
