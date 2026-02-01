from flask import Blueprint, render_template, request, flash, session, redirect, url_for
from flask_login import login_required, current_user
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from youtube_transcript_api.proxies import WebshareProxyConfig, GenericProxyConfig
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from db import summaries_collection, history_collection
from datetime import datetime
import re
import os
import asyncio

home_bp = Blueprint('home_bp', __name__)

# -------------------- Helpers --------------------

def get_video_id(url):
    if not url:
        return None

    # Normalize common copy/paste artifacts
    cleaned = url.strip()
    cleaned = cleaned.strip("[]()<>")
    cleaned = cleaned.split()[0]

    patterns = [
        r"v=([0-9A-Za-z_-]{11})",                 # watch?v=VIDEO_ID
        r"youtu\.be/([0-9A-Za-z_-]{11})",         # youtu.be/VIDEO_ID
        r"/shorts/([0-9A-Za-z_-]{11})",           # /shorts/VIDEO_ID
        r"/embed/([0-9A-Za-z_-]{11})",            # /embed/VIDEO_ID
        r"/live/([0-9A-Za-z_-]{11})",             # /live/VIDEO_ID
    ]

    for pattern in patterns:
        match = re.search(pattern, cleaned)
        if match:
            return match.group(1)

    # Fallback: raw 11-char ID
    match = re.search(r"\b([0-9A-Za-z_-]{11})\b", cleaned)
    return match.group(1) if match else None


def fetch_available_captions(video_url):
    video_id = get_video_id(video_url)
    if not video_id:
        return None

    try:
        proxy_config = None
        if os.getenv("PROXY_USERNAME") and os.getenv("PROXY_PASSWORD"):
            proxy_config = WebshareProxyConfig(
                proxy_username=os.getenv("PROXY_USERNAME"),
                proxy_password=os.getenv("PROXY_PASSWORD")
            )
        elif os.getenv("PROXY_URL"):
            proxy_config = GenericProxyConfig(
                http_url=os.getenv("PROXY_URL"),
                https_url=os.getenv("PROXY_URL")
            )

        api = YouTubeTranscriptApi(proxy_config=proxy_config) if proxy_config else YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        transcripts = list(transcript_list)

        preferred_langs = os.getenv("TRANSCRIPT_LANGS", "en")
        preferred_langs = [l.strip() for l in preferred_langs.split(",") if l.strip()]

        transcript = None

        for lang in preferred_langs:
            transcript = next(
                (t for t in transcripts if (not t.is_generated) and t.language_code == lang),
                None
            )
            if transcript:
                break

        if not transcript:
            for lang in preferred_langs:
                transcript = next(
                    (t for t in transcripts if t.is_generated and t.language_code == lang),
                    None
                )
                if transcript:
                    break

        if not transcript:
            transcript = next((t for t in transcripts if not t.is_generated), None)

        if not transcript and transcripts:
            transcript = transcripts[0]

        if not transcript:
            return None

        target_lang = os.getenv("TRANSCRIPT_TRANSLATE_TO", "").strip()
        if (
            target_lang
            and getattr(transcript, "is_translatable", False)
            and transcript.language_code != target_lang
        ):
            try:
                transcript = transcript.translate(target_lang)
            except Exception:
                pass

        formatter = TextFormatter()
        return formatter.format_transcript(transcript.fetch())

    except Exception as e:
        print("Caption error:", e)
        return None


# -------------------- Async summarization --------------------

async def summarize_chunk(chunk_text, index):
    try:
        llm = ChatOllama(
            model=os.getenv("OLLAMA_MODEL", "llama3.2:1b"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=0.7
        )

        prompt = PromptTemplate.from_template("""
        Summarize this transcript chunk into 2-3 concise bullet points.

        Chunk {num}:
        {text}
        """)

        response = await llm.ainvoke(
            prompt.format(text=chunk_text, num=index + 1)
        )

        return index, response.content

    except Exception as e:
        error_msg = str(e)
        if "Connection" in error_msg or "refused" in error_msg:
            print(f"⚠️ Ollama connection failed for chunk {index+1}. Is Ollama running?")
        else:
            print(f"Chunk {index+1} failed:", e)
        return index, None


async def generate_distributed_summary_async(text):
    try:
        splitter = RecursiveCharacterTextSplitter(chunk_size=3000, chunk_overlap=200)
        docs = splitter.split_documents([Document(page_content=text)])

        tasks = []
        for i, doc in enumerate(docs):
            tasks.append(
                summarize_chunk(doc.page_content, i)
            )

        results = await asyncio.gather(*tasks)

        summaries = [r for r in results if r[1]]
        summaries.sort(key=lambda x: x[0])

        if not summaries:
            return None

        combined = "\n".join(s[1] for s in summaries)

        llm = ChatOllama(
            model=os.getenv("OLLAMA_MODEL", "llama3.2:1b"),
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            temperature=0.7
        )

        final_prompt = PromptTemplate.from_template("""
        Create EXACTLY 10-15 bullet points from the summaries below.

        {text}
        """)

        final_response = await llm.ainvoke(final_prompt.format(text=combined))
        return final_response.content
    except Exception as e:
        error_msg = str(e).lower()
        if "connection" in error_msg or "refused" in error_msg:
            print("⚠️ ERROR: Cannot connect to Ollama. Please ensure Ollama is running on http://localhost:11434")
            print("   Run 'ollama serve' to start Ollama")
        else:
            print(f"⚠️ Summary generation error: {e}")
        return None


def generate_distributed_summary(text):
    return asyncio.run(generate_distributed_summary_async(text))


# -------------------- Routes --------------------

@home_bp.route('/home', methods=['GET', 'POST'])
@login_required
def home():
    if request.method == 'POST':
        youtube_url = request.form.get('youtube_url')
        video_id = get_video_id(youtube_url)

        if not video_id:
            flash("Invalid YouTube URL", "error")
            return redirect(url_for('home_bp.home'))

        cached = summaries_collection.find_one({'video_id': video_id})

        if cached:
            summary = cached['summary']
        else:
            captions = fetch_available_captions(youtube_url)
            if not captions:
                flash("Could not fetch captions from this video. Make sure it has subtitles/captions available.", "error")
                return redirect(url_for('home_bp.home'))

            summary = generate_distributed_summary(captions)

            # DO NOT STORE IF FAILED
            if not summary:
                flash("❌ Summary generation failed. Make sure Ollama is running (ollama serve) and the model is available.", "error")
                return redirect(url_for('home_bp.home'))

            summaries_collection.insert_one({
                'video_id': video_id,
                'video_url': youtube_url,
                'summary': summary,
                'created_at': datetime.utcnow()
            })

        history_collection.update_one(
            {'user_id': current_user.id, 'video_id': video_id},
            {'$set': {'video_url': youtube_url, 'viewed_at': datetime.utcnow()}},
            upsert=True
        )

        session['summary'] = summary
        session['current_user_id'] = current_user.id
        return redirect(url_for('home_bp.home'))

    if session.get('current_user_id') != current_user.id:
        session.pop('summary', None)

    return render_template(
        'home.html',
        username=current_user.username,
        summary=session.get('summary')
    )


@home_bp.route('/clear_summary')
@login_required
def clear_summary():
    session.clear()
    return redirect(url_for('home_bp.home'))


@home_bp.route('/history')
@login_required
def history():
    history = list(
        history_collection.find({'user_id': current_user.id}).sort('viewed_at', -1)
    )

    return render_template(
        'history.html',
        username=current_user.username,
        history=history
    )
