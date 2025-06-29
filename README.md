# YouTube Video Summarizer 🎥📝

A Flask web application that extracts YouTube video captions and generates AI-powered summaries using Google Gemini.

## Features

- Extract captions from YouTube videos (manual or auto-generated)
- Generate 10-15 bullet point summaries using Google Gemini 1.5 Flash
- Distributed processing across multiple API keys for better performance
- User authentication with Flask-Login
- Parallel chunk processing for faster results

## Technology Stack

- **Backend**: Flask (Python)
- **AI**: Google Gemini 1.5 Flash, LangChain
- **APIs**: YouTube Transcript API
- **Authentication**: Flask-Login
- **Processing**: ThreadPoolExecutor for parallel processing

## Installation

```bash
git clone <repository-url>
cd youtube-video-summarizer
pip install -r requirements.txt
```

## Dependencies

```txt
flask
flask-login
youtube-transcript-api
langchain
langchain-google-genai
langchain-core
```

## Configuration

Add your Google Gemini API keys in the code:

```python
api_keys = [
    "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY",
    "AIzaSyZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
    # Add more keys for better performance
]
```

## How It Works

1. Extracts video captions using YouTube Transcript API
2. Splits large transcripts into manageable chunks
3. Processes chunks in parallel using different API keys
4. Combines results into a final 10-15 point summary

## Run Application

```bash
python app.py
```

Navigate to `http://localhost:5000`

