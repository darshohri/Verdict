import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    completion = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": "Hello"}],
    )
    print("Success with openai/gpt-oss-120b:", completion.choices[0].message.content)
except Exception as e:
    print("Error with openai/gpt-oss-120b:", e)

try:
    completion = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[{"role": "user", "content": "Hello"}]
    )
    print("Success with qwen/qwen3.8-27b:", completion.choices[0].message.content)
except Exception as e:
    print("Error with qwen/qwen3.8-27b:", e)
