# 🚀 Clay LITE - Lead Enrichment Platform

**Affordable lead enrichment with AI-powered research using Google Gemini**

Clay LITE is a lightweight, cost-effective alternative to Clay.com, offering 80% of the functionality at 5% of the cost. Perfect for startups, small businesses, and solo entrepreneurs who need powerful lead enrichment without breaking the bank.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Features

### 📊 Spreadsheet Interface (Clay-like)
- **Table View**: Beautiful spreadsheet interface with sortable columns
- **Bulk Selection**: Select and enrich multiple leads at once
- **Progress Tracking**: Real-time enrichment status for each lead
- **Filtering & Sorting**: Organize leads by score, status, company, etc.

### 📥 Import/Export
- **CSV Import**: Mass import leads from CSV files
- **Flexible Mapping**: Auto-detects common column names (firstName, email, company, etc.)
- **CSV Export**: Export enriched data to CSV
- **Manual Entry**: Add leads one at a time

### 🔍 Enrichment Services (Waterfall Logic)

#### A) Company Enrichment (domain → company data)
1. **Clearbit API** (500 lookups/month FREE)
   - Company name, logo, description
   - Industry, employee count
   - Location, website, tech stack

2. **Web Scraping** (Unlimited, FREE)
   - Meta tags, company description
   - Logo detection
   - Basic tech stack detection

3. **Gemini AI Research** (Pay-per-use, ~$0.005/query)
   - Company overview and insights
   - Industry analysis
   - Target market identification

#### B) Email Enrichment
- **Syntax Validation** (Instant, FREE)
- **MX Record Check** (Instant, FREE)
- **Hunter.io** (25 verifications/month FREE)
  - Email validity score
  - Risk assessment

#### C) Contact Enrichment
- **Gemini AI Research**
  - Find LinkedIn profiles
  - Identify job titles
  - Professional background

#### D) AI Research Agent 🤖
**Powered by Google Gemini** - Your personal research assistant!

Automatically research:
- "What does [company] do?"
- "Find decision makers at [company]"
- "What are [industry] pain points?"
- "Best outreach strategy for [title]"

### 🏆 Lead Scoring System
Automatic scoring (0-100) based on:
- **Email Quality** (25 points): Validity, verification score
- **Company Quality** (30 points): Size, industry, enriched data
- **Title/Seniority** (25 points): C-level, VP, Director, Manager
- **Data Completeness** (20 points): # of filled fields

Grades: A (90+), B (75+), C (60+), D (40+), F (<40)

### 🔗 Integrations
- CSV Import/Export
- Google Sheets (via API)
- Webhook output
- REST API

## 💰 Pricing Breakdown

### FREE Tier (Start Here!)
- ✅ **Clearbit**: 500 company lookups/month
- ✅ **Hunter.io**: 25 email verifications/month
- ✅ **Web Scraping**: Unlimited (rate-limited by politeness)
- ✅ **Email Validation**: Unlimited
- ✅ **Lead Scoring**: Unlimited

### Pay-As-You-Go
- 💎 **Gemini AI**: ~$5-15/month for 1000-3000 researches
  - $0.00025 per 1K input tokens
  - $0.001 per 1K output tokens
  - ~$0.005 per research query

### TOTAL: **$0-20/month** for full functionality! 🎉

Compare to Clay.com: $349+/month 😱

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key ([Get it FREE](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
```bash
cd clay-lite
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - for better enrichment
CLEARBIT_API_KEY=your_clearbit_key
HUNTER_API_KEY=your_hunter_key
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Step 1: Configure API Keys
1. Click the **Settings** button (gear icon)
2. Add your **Gemini API Key** (required)
3. Optionally add Clearbit, Hunter.io keys for better enrichment
4. Click **Save Settings**

### Step 2: Import Leads
1. Click **Import** button
2. Upload a CSV file with columns like:
   - `firstName`, `lastName`
   - `email`
   - `company`, `domain`
   - `title`, `phone`, `linkedin`
3. Preview and confirm import

### Step 3: Enrich Leads
1. Select leads using checkboxes
2. Click **Enrich Selected**
3. Watch the magic happen! ✨

The system will:
- Validate emails
- Fetch company data (Clearbit → Web Scraping → Gemini)
- Research contacts with Gemini AI
- Calculate lead scores
- Find LinkedIn profiles and insights

### Step 4: Export Results
1. Click **Export** button
2. Download enriched CSV
3. Use in your CRM or outreach tool!

## 🔧 API Keys Setup

### Google Gemini API (Required)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)
4. Add to Settings in Clay LITE

**Free Tier**: 60 requests/minute, 1500 requests/day

### Clearbit (Optional - Recommended)
1. Sign up at [clearbit.com](https://clearbit.com)
2. Get free tier: 500 lookups/month
3. Find API key in dashboard
4. Add to Settings

### Hunter.io (Optional)
1. Sign up at [hunter.io](https://hunter.io)
2. Get free tier: 25 verifications/month
3. Find API key in Settings → API
4. Add to Clay LITE Settings

### Google Custom Search (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Custom Search API
3. Create API key
4. Create a search engine at [Programmable Search Engine](https://programmablesearchengine.google.com/)
5. Get Search Engine ID
6. Add both to Settings

## 🏗️ Architecture

```
clay-lite/
├── app/
│   ├── api/
│   │   └── enrich/
│   │       └── route.ts          # Enrichment API endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main page
│   └── globals.css               # Global styles
├── components/
│   ├── Header.tsx                # Top bar with actions
│   ├── Sidebar.tsx               # Navigation sidebar
│   ├── LeadsTable.tsx            # Main spreadsheet view
│   ├── ImportModal.tsx           # CSV import modal
│   └── SettingsModal.tsx         # API keys settings
├── lib/
│   ├── enrichment/
│   │   ├── orchestrator.ts       # Main enrichment logic
│   │   ├── gemini.ts             # Gemini AI integration
│   │   ├── clearbit.ts           # Clearbit integration
│   │   ├── hunter.ts             # Hunter.io integration
│   │   └── web-scraping.ts       # Website scraping
│   ├── scoring.ts                # Lead scoring algorithm
│   ├── csv.ts                    # CSV parse/export
│   └── utils.ts                  # Utility functions
├── types/
│   └── index.ts                  # TypeScript types
└── package.json
```

## 🎯 Roadmap

- [x] Spreadsheet interface
- [x] CSV import/export
- [x] Gemini AI research agent
- [x] Lead scoring
- [x] Waterfall enrichment
- [ ] Supabase database integration
- [ ] Workflow automation
- [ ] Google Sheets integration
- [ ] Scheduled enrichment runs
- [ ] Webhook triggers
- [ ] Email outreach integration
- [ ] Chrome extension for LinkedIn
- [ ] Mobile app

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) - AI-powered research
- [Clearbit](https://clearbit.com) - Company enrichment
- [Hunter.io](https://hunter.io) - Email verification
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## 💡 Why Clay LITE?

| Feature | Clay.com | Clay LITE |
|---------|----------|-----------|
| **Pricing** | $349+/mo | $0-20/mo |
| **Spreadsheet UI** | ✅ | ✅ |
| **CSV Import/Export** | ✅ | ✅ |
| **Company Enrichment** | ✅ | ✅ |
| **Email Verification** | ✅ | ✅ |
| **AI Research** | Claude | **Gemini** |
| **Lead Scoring** | ✅ | ✅ |
| **Data Providers** | 75+ | 5+ (free ones!) |
| **Monthly Credits** | Limited | Mostly unlimited |
| **Self-hosted** | ❌ | ✅ |
| **Open Source** | ❌ | ✅ |

**Clay LITE is perfect for:**
- 🚀 Startups validating product-market fit
- 💼 Solo entrepreneurs and freelancers
- 🏢 Small businesses (<50 leads/day)
- 🎓 Students and learners
- 🧪 Testing lead enrichment before scaling

**Upgrade to Clay.com when:**
- You need 75+ data providers
- You're enriching 1000+ leads/day
- You need advanced workflow automation
- You have budget for enterprise tools

## 📧 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Made with ❤️ and Gemini AI**

*Save $329/month. Invest in your business instead.* 💰
