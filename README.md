# YouTube Video Summarizer 🎥📝

A Flask web application that extracts YouTube video captions and generates AI-powered summaries using Ollama (local Llama 3.2 1B).

## Features

- Extract captions from YouTube videos (manual or auto-generated)
- Generate 10-15 bullet point summaries using Ollama (Llama 3.2 1B)
- User authentication with Flask-Login
- Parallel chunk processing for faster results

## Technology Stack

- **Backend**: Flask (Python)
- **AI**: Ollama (Llama 3.2 1B), LangChain
- **APIs**: YouTube Transcript API
- **Authentication**: Flask-Login
- **Processing**: ThreadPoolExecutor for parallel processing


## Dependencies

```txt
flask
flask-login
youtube-transcript-api
langchain
langchain-ollama
langchain-core
```

## Configuration

Ensure Ollama is running and the model is available locally:

```bash
ollama pull llama3.2:1b
```

Set environment variables in `.env` (optional overrides):

```txt
OLLAMA_MODEL=llama3.2:1b
OLLAMA_BASE_URL=http://localhost:11434
```

## How It Works

1. Extracts video captions using YouTube Transcript API
2. Splits large transcripts into manageable chunks
3. Processes chunks in parallel using Ollama
4. Combines results into a final 10-15 point summary

## Run Application

```bash
python app.py
```

Navigate to `http://localhost:5000`

