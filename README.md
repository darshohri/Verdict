# Verdict 

Verdict is an AI-powered product evaluation engine designed to help you make smarter purchasing decisions. Simply paste an Amazon or Flipkart product URL, and Verdict will instantly crawl reviews, analyze price trends, and synthesize a clear **BUY**, **WAIT**, or **AVOID** verdict.

## Features 🚀

- **Instant Evaluation**: Get comprehensive pros, cons, and a final verdict within seconds.
- **Deep Web Scraping**: Extracts verified purchaser feedback and hidden flaws using Apify (Amazon) and custom JSON-LD scraping (Flipkart).
- **AI-Powered Analysis**: Utilizes `openai/gpt-oss-120b` via Groq for high-speed, highly intelligent sentiment analysis and product evaluation.
- **Interactive AI Chat Assistant**: Ask detailed questions about the product you just searched! The assistant is powered by `qwen/qwen3.8-27b` and knows exactly what product you are looking at.
- **Cinematic UI**: A buttery-smooth, dynamic interface built with Next.js, Tailwind CSS, and Framer Motion.

## Tech Stack 💻

- **Frontend**: Next.js (React), Tailwind CSS, Framer Motion, Lucide React
- **Backend**: FastAPI (Python), Uvicorn, BeautifulSoup4
- **Scraping**: Apify API, Requests
- **AI Models**: Groq Cloud API

## Getting Started 🛠️

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Free API Keys from [Groq](https://console.groq.com/) and [Apify](https://console.apify.com/)

### 1. Clone the repository
```bash
git clone https://github.com/darshohri/Verdict.git
cd Verdict
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory based on the provided `.env.example`:
```bash
cp .env.example .env
```
Open `.env` and paste your Groq and Apify API keys.

### 3. Start the Backend (FastAPI)
```bash
pip install -r requirements.txt
python main.py
```
*The backend will run on `http://127.0.0.1:8000`*

### 4. Start the Frontend (Next.js)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will be available at `http://localhost:3000`*

## How it works 🧠
1. **Extracting Intelligence**: The backend initiates an asynchronous scrape of the product URL.
2. **Analyzing Sentiments & Prices**: Extracted HTML and JSON-LD data are parsed to find the product name, image, price, and customer reviews.
3. **Synthesizing Verdict**: The parsed data is structured and sent to the Groq LLM API with a strict system prompt to generate a JSON response containing the verdict.
4. **Chatting**: The frontend passes the evaluated context back to the backend whenever you send a chat message, allowing the AI to answer specifically about the active product.

## Software Engineering Specifications (Academic / Course Submission) 📐

Verdict is developed following rigorous Software Engineering principles and standards.

### 1. Process Model: Agile Scrum with Evolutionary Prototyping
- **Rationale**: Web scraping targets (Amazon/Flipkart DOM selectors) and LLM prompt schemas evolve rapidly. A rigid Waterfall model would introduce catastrophic requirement freeze delays.
- **Sprints**: 2-week sprint iterations focused on URL parsing, multi-marketplace scraping pipelines, LLM JSON output validation, and responsive glassmorphic UI interactions.

### 2. Architectural Design Styles
Verdict implements three architectural design paradigms:
1. **Client-Server Architecture**: Next.js client communicating over asynchronous HTTP/REST JSON contracts with a FastAPI / Python backend.
2. **Layered (N-Tier) Architecture**:
   - *Presentation Layer*: Next.js 14, Tailwind CSS, Framer Motion, Lenis.
   - *Controller / Routing Layer*: FastAPI REST endpoints (`/api/v1/verdict/evaluate`, `/shopping`, `/chat`).
   - *Domain / Business Logic Layer*: `MatchingService`, `RankingService`, `IntentService`.
   - *External Integration Layer*: Apify Web Scrapers and Groq Cloud LPU LLM inference.
3. **Pipe-and-Filter Architecture**: Sequential data transformations:
   $$\text{Raw URL} \xrightarrow{\text{Parser}} \text{Product ID} \xrightarrow{\text{Scraper}} \text{Raw DOM/JSON} \xrightarrow{\text{Sanitizer}} \text{Context} \xrightarrow{\text{LLM Filter}} \text{Verdict JSON} \xrightarrow{\text{UI Filter}} \text{Screen}$$

### 3. Project Estimation & COCOMO Calculation (Organic Mode)
- **Source Code Base**: **2,541 LOC (2.541 KLOC)** across 26 source files.
- **Basic COCOMO Formula**:
  - For Organic software projects: $a_b = 2.4$, $b_b = 1.05$, $c_b = 2.5$, $d_b = 0.38$
  - **Effort ($E$)**:
    $$E = 2.4 \times (2.541)^{1.05} \approx \mathbf{6.37\text{ Person-Months}}$$
  - **Development Time ($D$)**:
    $$D = 2.5 \times (6.37)^{0.38} \approx \mathbf{5.05\text{ Months}}$$
  - **Average Team Size ($SS$)**:
    $$SS = \frac{E}{D} = \frac{6.37}{5.05} \approx \mathbf{1.26 \approx 1\text{ to }2\text{ Developers}}$$

### 4. UML & Data Flow Models
- **Actors**: `Guest Consumer`, `Authenticated User`, `Apify Web Scraper`, `Groq Cloud LLM`.
- **Use Cases**: `UC-01` Evaluate Product URL, `UC-02` Ingest Reviews, `UC-03` Synthesize Verdict, `UC-04` Interactive AI Chat, `UC-05` User Authentication & Session Management, `UC-06` View & Export Saved History.
- **Data Flow (DFD)**:
  - *Level 0*: Shopper $\leftrightarrow$ Verdict Engine $\leftrightarrow$ Scraper & LLM APIs.
  - *Level 1*: URL Validation $\rightarrow$ Marketplace Crawler $\rightarrow$ Review Data Cleaner $\rightarrow$ LLM Synthesis $\rightarrow$ Caching & Presentation.

### 5. UI Design (Golden Rules)
- **Place User in Control**: Single clear search bar, one-click reset home button, and instant demo account login.
- **Reduce Memory Load**: Instant tri-state color-coded verdict pills (🟢 BUY, 🟡 WAIT, 🔴 AVOID), dynamic price history visualization.
- **Consistent Interface**: Cohesive glassmorphism design system, unified typography, and smooth framer-motion animations.

### 6. Quality Assurance & Testing
- **Unit Testing**: Normalization logic in `test/test_matching.py`.
- **Validation Testing**: Handling malformed URLs, non-e-commerce domains, and fallback redirects for Flipkart canonical slugs.
- **State Persistence**: User profile tokens and evaluation history cached via client-side data stores.

## License 📄
MIT License

