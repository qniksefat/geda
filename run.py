import uvicorn

if __name__ == "__main__":
    uvicorn.run("geda.main:app", host="0.0.0.0", port=8003, reload=True)