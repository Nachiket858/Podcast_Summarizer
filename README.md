# YouTube Podcast Summarizer 🎥📝

A modern Flask web application that extracts YouTube video captions and generates AI-powered summaries using Ollama (local Llama 3.2 1B), featuring an interactive chat interface.

## ✨ Features

- **Modern Sidebar UI**: Clean, professional interface with dedicated navigation sidebar
- **YouTube Video Summarization**: Extract captions from YouTube videos (manual or auto-generated)
- **AI-Powered Summaries**: Generate 10-15 bullet point summaries using Ollama (Llama 3.2 1B)
- **Interactive Chat**: Ask questions about summarized content using AI-powered chat
- **User Authentication**: Secure signup/login system with Flask-Login
- **History Tracking**: Access previously summarized videos from the sidebar
- **Smart Caching**: Avoid re-processing by caching summaries in MongoDB
- **Parallel Processing**: Process large transcripts in chunks for faster results

## 🎨 User Interface

The application features a modern, card-based design with:
- **Left Sidebar Navigation**: Logo, "Create New" button, History access, and user profile
- **Main Content Area**: Centered "Start Your Analysis" page with prominent input card
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Clean Aesthetics**: Professional color scheme with smooth transitions and shadows

## 🛠️ Technology Stack

- **Backend**: Flask (Python)
- **AI Engine**: Ollama (Llama 3.2 1B), LangChain
- **Database**: MongoDB (user authentication, summaries, chat history)
- **APIs**: YouTube Transcript API
- **Authentication**: Flask-Login
- **Processing**: ThreadPoolExecutor for parallel chunk processing
- **Frontend**: HTML, CSS with modern card-based layout

## 📦 Dependencies

```txt
flask
flask-login
pymongo
youtube-transcript-api
langchain
langchain-ollama
langchain-core
langchain-community
chromadb
python-dotenv
```

## ⚙️ Configuration

Ensure Ollama is running and the model is available locally:

```bash
ollama pull llama3.2:1b
```

Set environment variables in `.env`:

```txt
SECRET_KEY=your-secret-key
OLLAMA_MODEL=llama3.2:1b
OLLAMA_BASE_URL=http://localhost:11434
```

## 🚀 How It Works

1. **Extract Captions**: Fetches video captions using YouTube Transcript API
2. **Process in Chunks**: Splits large transcripts into manageable segments
3. **Parallel AI Processing**: Uses Ollama to process chunks simultaneously
4. **Generate Summary**: Combines results into a final 10-15 point summary
5. **Interactive Chat**: Stores context in vector database for follow-up questions
6. **Smart Caching**: Saves summaries to avoid re-processing

## 💻 Run Application

```bash
# Activate virtual environment
.\venv\Scripts\activate

# Run the application
python app.py
```

Navigate to `http://localhost:5000`

## 📱 Usage Flow

1. **Sign Up/Login**: Create an account or log in
2. **Paste YouTube URL**: Enter a YouTube video URL in the input card
3. **Analyze**: Click "Analyze Link" to generate summary
4. **View Summary**: See 10-15 bullet points with key insights
5. **Chat**: Ask questions about the video content
6. **Access History**: View all previous summaries from the sidebar

## 🎯 Use Cases

- **Students**: Quickly summarize educational tutorials and lectures
- **Professionals**: Extract insights from industry podcasts and webinars
- **Content Creators**: Research competitors' content efficiently
- **General Users**: Decide if a long video is worth watching

---

**Built with ❤️ using Flask, Ollama, and modern web design principles**
