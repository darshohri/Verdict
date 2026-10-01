# Verdict 🎧

Verdict is an AI-powered product evaluation engine designed to help you make smarter purchasing decisions. Simply paste an Amazon or Flipkart product URL, and Verdict will instantly crawl reviews, analyze price trends, and synthesize a clear **BUY**, **WAIT**, or **AVOID** verdict.

![Verdict Banner](frontend/public/headphones-cutout.png)

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

## License 📄
MIT License
