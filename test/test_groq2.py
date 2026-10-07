import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Hello"}]
    )
    print("Success with llama-3.3-70b-versatile:", completion.choices[0].message.content)
except Exception as e:
    print("Error with llama-3.3-70b-versatile:", e)

try:
    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": "Hello"}]
    )
    print("Success with llama-3.1-8b-instant:", completion.choices[0].message.content)
except Exception as e:
    print("Error with llama-3.1-8b-instant:", e)

try:
    completion = client.chat.completions.create(
        model="mixtral-8x7b-32768",
        messages=[{"role": "user", "content": "Hello"}]
    )
    print("Success with mixtral-8x7b-32768:", completion.choices[0].message.content)
except Exception as e:
    print("Error with mixtral-8x7b-32768:", e)

try:
    completion = client.chat.completions.create(
        model="gemma2-9b-it",
        messages=[{"role": "user", "content": "Hello"}]
    )
    print("Success with gemma2-9b-it:", completion.choices[0].message.content)
except Exception as e:
    print("Error with gemma2-9b-it:", e)
