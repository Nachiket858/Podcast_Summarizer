# Project Overview

## Project Title
**YouTube Video Summarizer (Podcast Summarizer)**

## Project Description
The YouTube Video Summarizer is a smart web application designed to save users time by automatically generating concise summaries of YouTube videos. By leveraging local AI models (Ollama), it extracts captions from videos and produces structured, easy-to-read bullet-point insights, making it perfect for summarizing podcasts, educational content, and long-form videos.

## Problem Statement
In today's fast-paced world, consuming long-form video content like 2-3 hour podcasts or lectures to find key information is time-consuming and inefficient. Users often struggle to quickly identify the main takeaways from lengthy videos without watching them in their entirety.

**This project solves this by:**
*   Eliminating the need to watch the full video.
*   Providing instant, structured summaries.
*   Allowing users to keep track of their summarized content history.

## Key Features
*   **Auto-Summarization**: Instantly generates a 10-15 bullet point summary of any supported YouTube video.
*   **User Authentication**: Secure Signup and Login system to manage user sessions.
*   **History Tracking**: Saves a history of videos you have summarized for easy access later.
*   **Smart Caching**: Checks if a video has already been summarized to deliver instant results without re-processing.
*   **Parallel Processing**: Splits long video transcripts into chunks and processes them simultaneously for faster performance.
*   **Local AI Privacy**: Uses a locally running Ollama instance (Llama 3.2 1B) for privacy and cost-efficiency.

## How the Project Works (Workflow)
1.  **User Login**: The user logs into the application using their credentials.
2.  **Input URL**: The user pastes a YouTube video URL into the input field on the home page.
3.  **Validation**: The system validates the URL and extracts the unique Video ID.
4.  **Cache Check**: The system checks the database to see if a summary for this video already exists.
    *   *If yes*: It retrieves and displays the existing summary instantly.
    *   *If no*: It proceeds to the next steps.
5.  **Caption Extraction**: The application uses the YouTube Transcript API to fetch the video's subtitles/captions.
6.  **Chunking**: If the transcript is long, it is split into smaller, manageable text chunks.
7.  **AI Processing**: Each chunk is sent to the local Ollama AI model to be summarized in parallel.
8.  **Final Compilation**: The AI combines all chunk summaries into a final, coherent 10-15 point list.
9.  **Output & Storage**: The summary is displayed to the user and saved to the database for future reference.

## Tech Stack
*   **Language**: Python
*   **Web Framework**: Flask
*   **Database**: MongoDB (storing Users, Summaries, and History)
*   **AI Engine**: Ollama (running Llama 3.2 1B model)
*   **Orchestration**: LangChain & LangChain Ollama
*   **APIs**: YouTube Transcript API
*   **Asynchronous Processing**: Python `asyncio` for parallel tasks
*   **Frontend**: HTML, CSS (in `templates` and `static` folders)

## Project Structure
*   **`app.py`**: The main entry point of the application. Handles app startup, database connections, and user authentication routes (Login/Signup).
*   **`home.py`**: Contains the core logic for the home page, video processing, AI summarization, and history management.
*   **`templates/`**: Contains the HTML files for the user interface (`index.html`, `login.html`, `home.html`, etc.).
*   **`static/`**: Stores static assets like CSS files and images.
*   **`db.py`**: Handles the connection to the MongoDB database.
*   **`requirements.txt`**: Lists all the Python libraries required to run the project.

## Input and Output
*   **Input**: A standard YouTube Video URL (e.g., `https://www.youtube.com/watch?v=...`).
*   **Output**: A structured text summary consisting of 10-15 key bullet points.

## Use Cases
*   **Students**: Quickly summarizing educational tutorials or lectures.
*   **Professionals**: Extracting key insights from industry podcasts and webinars.
*   **Content Creators**: Researching competitors' video content efficiently.
*   **General Users**: Deciding whether a long video is worth watching by reading the summary first.

