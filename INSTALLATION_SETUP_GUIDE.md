# 🎥 YouTube Podcast Summarizer - Complete Installation & Setup Guide

This guide will walk you through every step needed to install and run the YouTube Podcast Summarizer application from scratch on your Windows machine.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Python](#step-1-install-python)
3. [Step 2: Install MongoDB](#step-2-install-mongodb)
4. [Step 3: Install Ollama](#step-3-install-ollama)
5. [Step 4: Setup the Project](#step-4-setup-the-project)
6. [Step 5: Run the Application](#step-5-run-the-application)
7. [Troubleshooting](#troubleshooting)
8. [Project Features](#project-features)

---

## Prerequisites

Before you begin, ensure you have:
- Windows 10 or later
- Administrator access on your computer
- Stable internet connection (for downloading dependencies)
- At least 4GB of free disk space

---

## Step 1: Install Python

### 1.1 Download Python

1. Go to [https://www.python.org/downloads/](https://www.python.org/downloads/)
2. Download **Python 3.10** or **Python 3.11** (recommended)
3. Run the downloaded installer

### 1.2 Install Python

1. **IMPORTANT**: Check the box "Add Python to PATH" at the bottom
2. Click "Install Now"
3. Wait for installation to complete
4. Click "Close"

### 1.3 Verify Installation

Open Command Prompt (CMD) or PowerShell and run:

```bash
python --version
```

You should see output like: `Python 3.10.x` or `Python 3.11.x`

Also verify pip is installed:

```bash
pip --version
```

---

## Step 2: Install MongoDB

### 2.1 Download MongoDB Community Server

1. Go to [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Select:
   - **Version**: Latest (e.g., 8.x)
   - **Platform**: Windows
   - **Package**: MSI
3. Click **Download**

### 2.2 Install MongoDB

1. Run the downloaded MSI installer
2. Click **Next** through the setup wizard
3. Accept the license agreement
4. Choose **Complete** installation
5. **IMPORTANT**: Check "Install MongoDB as a Service"
   - Service Name: `MongoDB`
   - Run service as: `Network Service user`
6. **Check** "Install MongoDB Compass" (GUI tool for viewing database)
7. Click **Install**
8. Wait for installation to complete
9. Click **Finish**

### 2.3 Verify MongoDB Installation

Open Command Prompt and run:

```bash
mongod --version
```

You should see the MongoDB version information.

### 2.4 Start MongoDB Service

MongoDB should start automatically as a Windows service. To verify:

```bash
net start MongoDB
```

If it says "The requested service has already been started," you're good to go!

---

## Step 3: Install Ollama

Ollama is the local AI engine that powers the summarization feature.

### 3.1 Download Ollama

1. Go to [https://ollama.ai/download](https://ollama.ai/download)
2. Click **Download for Windows**
3. Run the downloaded installer

### 3.2 Install Ollama

1. Run the `OllamaSetup.exe` installer
2. Follow the installation wizard
3. Click **Install**
4. Wait for installation to complete

### 3.3 Verify Ollama Installation

Open Command Prompt or PowerShell and run:

```bash
ollama --version
```

You should see the Ollama version.

### 3.4 Download the AI Model

The project uses the **gpt-oss:latest** model. Download it by running:

```bash
ollama gpt-oss:latest
```

This will download the model (approximately 1-2 GB). Wait for it to complete.

### 3.5 Start Ollama Service

Ollama should start automatically in the background. To manually start it:

```bash
ollama serve
```

**Note**: You can close this terminal window after a few seconds. Ollama will continue running in the background.

To verify Ollama is running, open a new terminal and run:

```bash
ollama list
```

You should see `gpt-oss:latest` in the list of available models.

---

## Step 4: Setup the Project

### 4.1 Extract the Project

1. Extract the provided ZIP file to a location of your choice (e.g., `C:\Projects\Podcast_Summarizer`)
2. Open Command Prompt or PowerShell
3. Navigate to the project folder:

```bash
cd C:\Projects\Podcast_Summarizer
```

*(Replace with your actual path)*

### 4.2 Create a Virtual Environment (Recommended)

Creating a virtual environment keeps your project dependencies isolated:

```bash
python -m venv venv
```

### 4.3 Activate the Virtual Environment

```bash
venv\Scripts\activate
```

You should see `(venv)` at the beginning of your command prompt.

### 4.4 Install Python Dependencies

Install all required packages using pip:

```bash
pip install -r requirements.txt
```

This will install:
- Flask (web framework)
- Flask-Login (authentication)
- PyMongo (MongoDB driver)
- LangChain (AI framework)
- Ollama integration
- YouTube Transcript API
- And all other dependencies

Wait for the installation to complete.

### 4.5 Verify Environment File

The project includes a `.env` file with default configurations:

```
SECRET_KEY=super-secret-key
OLLAMA_MODEL=llama3.2:1b
OLLAMA_BASE_URL=http://localhost:11434
```

**Note**: You can customize these values if needed, but the defaults work fine.

---

## Step 5: Run the Application

### 5.1 Ensure All Services Are Running

Before running the app, make sure:

1. **MongoDB is running**:
   ```bash
   net start MongoDB
   ```

2. **Ollama is running**:
   ```bash
   ollama serve
   ```
   *(You can minimize this window)*

### 5.2 Start the Flask Application

In your project directory (with virtual environment activated):

```bash
python app.py
```

You should see output like:

```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

### 5.3 Access the Application

Open your web browser and go to:

```
http://localhost:5000
```

Or:

```
http://127.0.0.1:5000
```

### 5.4 Create an Account

1. Click **Sign Up**
2. Enter a username (minimum 4 characters)
3. Enter a password (minimum 6 characters)
4. Click **Create Account**

### 5.5 Login and Use

1. Login with your credentials
2. Paste a YouTube video URL
3. Click **Summarize**
4. Wait for the AI to generate a summary (this may take 30-60 seconds)
5. View your 10-15 bullet point summary!

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to Ollama"

**Solution**:
1. Make sure Ollama is running:
   ```bash
   ollama serve
   ```
2. Verify the model is downloaded:
   ```bash
   ollama list
   ```
3. If the model is missing, download it:
   ```bash
   ollama pull llama3.2:1b
   ```

---

### Issue: "Could not fetch captions from this video"

**Solution**:
- The video might not have captions/subtitles available
- Try a different YouTube video that has captions enabled
- Check if the video is age-restricted or private

---

### Issue: MongoDB connection error

**Solution**:
1. Start MongoDB service:
   ```bash
   net start MongoDB
   ```
2. If it fails, check if MongoDB is installed correctly:
   ```bash
   mongod --version
   ```

---

### Issue: "pip is not recognized"

**Solution**:
- Reinstall Python and make sure to check "Add Python to PATH"
- Or add Python to PATH manually in Environment Variables

---

### Issue: Port 5000 already in use

**Solution**:
1. Edit `app.py` at the bottom and change:
   ```python
   app.run(debug=True, port=5001)
   ```
2. Access the app at `http://localhost:5001`

---

## 📚 Project Features

### ✨ Key Features

- **YouTube Video Summarization**: Extracts captions from YouTube videos and generates concise summaries
- **AI-Powered**: Uses Ollama (Llama 3.2 1B) for local, privacy-focused AI processing
- **User Authentication**: Secure signup/login system with Flask-Login
- **Summary Caching**: Summaries are cached in MongoDB to avoid re-processing
- **History Tracking**: View your previously summarized videos
- **Parallel Processing**: Processes large transcripts in chunks for faster results

### 🛠️ Technology Stack

- **Backend**: Flask (Python)
- **Database**: MongoDB
- **AI Engine**: Ollama (Llama 3.2 1B)
- **AI Framework**: LangChain
- **APIs**: YouTube Transcript API
- **Authentication**: Flask-Login
- **Frontend**: HTML, CSS, JavaScript

### 📁 Project Structure

```
Podcast_Summarizer/
├── app.py                 # Main Flask application (authentication routes)
├── home.py                # Home blueprint (summarization logic)
├── db.py                  # MongoDB connection setup
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
├── templates/             # HTML templates
│   ├── index.html        # Landing page
│   ├── signup.html       # Signup page
│   ├── login.html        # Login page
│   ├── home.html         # Main app interface
│   └── history.html      # View history
└── static/               # CSS and JavaScript
    ├── style.css         # Styling
    └── script.js         # Frontend logic
```

---

## 🎯 Usage Tips

1. **Best Video Types**: Works best with educational videos, podcasts, tutorials, and lectures
2. **Processing Time**: Longer videos take more time to process (30-120 seconds)
3. **Internet Required**: Needed to fetch YouTube captions
4. **Offline AI**: Ollama runs completely offline after model download
5. **Privacy**: All processing happens locally on your machine

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check that all services are running (MongoDB, Ollama, Flask)
2. Verify Python version is 3.10 or 3.11
3. Ensure all dependencies are installed correctly
4. Check firewall settings if connection issues persist

---

## 🚀 Next Steps

- Try summarizing different types of YouTube content
- Check your history to revisit previous summaries
- Explore the codebase to customize the summarization prompt
- Experiment with different Ollama models (requires code modification)

---

**Enjoy using the YouTube Podcast Summarizer!** 🎉
