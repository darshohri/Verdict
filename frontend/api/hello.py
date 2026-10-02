from fastapi import FastAPI

app = FastAPI()

@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI on Vercel!"}

@app.post("/api/hello")
def hello_post():
    return {"message": "Hello POST from FastAPI on Vercel!"}
