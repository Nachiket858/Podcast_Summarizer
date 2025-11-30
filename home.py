from flask import Blueprint, render_template, request, flash
from flask_login import login_required, current_user
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from youtube_transcript_api.proxies import WebshareProxyConfig, GenericProxyConfig
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_core.documents import Document
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
import re
import random
import time
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

home_bp = Blueprint('home_bp', __name__)

def get_video_id(url):
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    return match.group(1) if match else None

def fetch_available_captions(video_url):
    video_id = get_video_id(video_url)
    if not video_id:
        return None
    
    try:
        # Configure proxy if available
        proxy_config = None
        proxy_username = os.getenv('PROXY_USERNAME')
        proxy_password = os.getenv('PROXY_PASSWORD')
        proxy_url = os.getenv('PROXY_URL')

        if proxy_username and proxy_password:
             proxy_config = WebshareProxyConfig(
                proxy_username=proxy_username,
                proxy_password=proxy_password
            )
        elif proxy_url:
            proxy_config = GenericProxyConfig(
                http_url=proxy_url,
                https_url=proxy_url
            )

        # Instantiate the API with proxy config if present
        if proxy_config:
            ytt_api = YouTubeTranscriptApi(proxy_config=proxy_config)
        else:
            ytt_api = YouTubeTranscriptApi()

        # Use the instance method to list transcripts
        transcript_list = ytt_api.list(video_id)
        
        # Iterate to find the best transcript (manual > generated)
        transcript = None
        
        # First try to find a manually created transcript
        for t in transcript_list:
            if not t.is_generated:
                transcript = t
                break
        
        # If no manual transcript found, use the first available (which would be generated)
        if not transcript:
            try:
                transcript = transcript_list.find_generated_transcript(['en'])
            except:
                # If specific 'en' generated fails, just take the first one
                for t in transcript_list:
                    transcript = t
                    break
        
        if not transcript:
             return None
        
        formatter = TextFormatter()
        return formatter.format_transcript(transcript.fetch())
    except Exception as e:
        print("Error:", e)
        return None

def summarize_chunk_with_api_key(chunk_text, api_key, chunk_index):
    """Summarize a single chunk using a specific API key"""
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0.7
        )
        
        prompt = PromptTemplate.from_template("""
        You are a podcast summarizer.
        Summarize the following transcript chunk in exactly 2-3 concise bullet points.
        Focus only on the most important topics and key insights.
        Keep each point brief and specific.
        
        Transcript Chunk {chunk_num}:
        {text}
        
        Summary (2-3 bullet points only):
        """)
        
        formatted_prompt = prompt.format(text=chunk_text, chunk_num=chunk_index + 1)
        response = llm.invoke(formatted_prompt)
        
        print(f"Chunk {chunk_index + 1} processed with API key ending in ...{api_key[-4:]}")
        return {
            'chunk_index': chunk_index,
            'summary': response.content,
            'success': True
        }
        
    except Exception as e:
        print(f"Error processing chunk {chunk_index + 1} with API key ...{api_key[-4:]}: {e}")
        return {
            'chunk_index': chunk_index,
            'summary': None,
            'success': False,
            'error': str(e)
        }

def generate_distributed_summary(text):
    """Generate summary using distributed processing across multiple API keys"""
    
    # Get API keys from environment variable
    api_keys_str = os.getenv('GOOGLE_API_KEYS')
    if api_keys_str:
        api_keys = [key.strip() for key in api_keys_str.split(',') if key.strip()]
    else:
        # Fallback to hardcoded keys if env var not set (WARN: Should be removed in production)
        api_keys = [
            "Api_one",
            "Api_two",
            "Api_three",
            

        ]
    
    if not api_keys:
        return "Error: No API keys configured."
    
    try:
        # Split the text into chunks
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=3000,  # Increased chunk size since we're processing in parallel
            chunk_overlap=200
        )
        doc = Document(page_content=text)
        docs = splitter.split_documents([doc])
        
        if not docs:
            return "No content to summarize."
        
        print(f"Processing {len(docs)} chunks across {len(api_keys)} API keys...")
        
        # Distribute chunks across API keys
        chunk_summaries = []
        failed_chunks = []
        
        # Use ThreadPoolExecutor for parallel processing
        with ThreadPoolExecutor(max_workers=len(api_keys)) as executor:
            # Submit tasks - cycle through API keys
            future_to_chunk = {}
            
            for i, doc_chunk in enumerate(docs):
                api_key = api_keys[i % len(api_keys)]  # Cycle through API keys
                future = executor.submit(
                    summarize_chunk_with_api_key, 
                    doc_chunk.page_content, 
                    api_key, 
                    i
                )
                future_to_chunk[future] = i
                
                # Add small delay to avoid overwhelming the APIs
                time.sleep(0.5)
            
            # Collect results as they complete
            for future in as_completed(future_to_chunk):
                result = future.result()
                if result['success']:
                    chunk_summaries.append(result)
                else:
                    failed_chunks.append(result)
        
        # Sort summaries by chunk index to maintain order
        chunk_summaries.sort(key=lambda x: x['chunk_index'])
        
        if not chunk_summaries:
            return "Failed to process any chunks. Please try again."
        
        # Combine all chunk summaries
        combined_summaries = "\n\n".join([
            f"Section {summary['chunk_index'] + 1}:\n{summary['summary']}" 
            for summary in chunk_summaries
        ])
        
        # Generate final summary using a random API key
        final_api_key = random.choice(api_keys)
        final_llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=final_api_key,
            temperature=0.7
        )
        
        final_prompt = PromptTemplate.from_template("""
        You are an expert content summarizer.
        Below are summaries from different sections of a podcast/video transcript.
        Create a final summary in EXACTLY 10-15 bullet points that captures the main themes and key insights.
        
        IMPORTANT INSTRUCTIONS:
        - Use exactly 10-15 bullet points, no more, no less
        - Keep each bullet point concise (1-2 sentences maximum)
        - Focus on the most important and unique insights
        - Avoid repetition between points
        - Prioritize actionable insights and key takeaways
        
        Section Summaries:
        {summaries}
        
        Final Summary (10-15 bullet points):
        """)
        
        formatted_final_prompt = final_prompt.format(summaries=combined_summaries)
        final_response = final_llm.invoke(formatted_final_prompt)
        
        # Add processing info
        processing_info = f"\n\n---\nProcessed {len(chunk_summaries)} chunks successfully"
        if failed_chunks:
            processing_info += f", {len(failed_chunks)} chunks failed"
        processing_info += f" using {len(api_keys)} API keys."
        
        return final_response.content + processing_info
        
    except Exception as e:
        print("Distributed summarization error:", e)
        return f"Error generating summary: {str(e)}"

def generate_summary_fallback(text):
    """Fallback to original method if distributed processing fails"""
    # Get API keys from environment variable
    api_keys_str = os.getenv('GOOGLE_API_KEYS')
    if api_keys_str:
        api_keys = [key.strip() for key in api_keys_str.split(',') if key.strip()]
    else:
        api_keys = [
            "FallBack_api_one",
            "FallBack_api_two",
            "FallBack_api_three",
        ]
    
    if not api_keys:
        return "Error: No API keys configured."

    selected_key = random.choice(api_keys)
    
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",   
            google_api_key=selected_key,
            temperature=0.7
        )
        
        # Simple summarization for fallback
        prompt = PromptTemplate.from_template("""
        You are a podcast summarizer.
        Summarize the following transcript in exactly 10-15 clear bullet points.
        Keep each point concise and focus on key insights only.
        
        Transcript:
        {text}
        
        Summary (10-15 bullet points):
        """)
        
        # Truncate text if too long for single request
        max_length = 8000
        if len(text) > max_length:
            text = text[:max_length] + "... [truncated]"
        
        formatted_prompt = prompt.format(text=text)
        response = llm.invoke(formatted_prompt)
        return response.content
        
    except Exception as e:
        print("Fallback summarization error:", e)
        return None

@home_bp.route('/home', methods=['GET', 'POST'])
@login_required
def home():
    summary = None
    if request.method == 'POST':
        youtube_url = request.form.get('youtube_url')
        if youtube_url:
            captions = fetch_available_captions(youtube_url)
            if captions:
                print(f"Captions length: {len(captions)} characters")
                
                # Try distributed processing first
                summary = generate_distributed_summary(captions)
                
                # If distributed processing fails, try fallback
                if not summary or "Error generating summary" in summary:
                    print("Distributed processing failed, trying fallback...")
                    summary = generate_summary_fallback(captions)
                
                if not summary:
                    flash('Failed to generate summary. Please try another video.')
            else:
                flash('Could not fetch captions for this video. Try another one.')
    
    return render_template(
        'home.html',
        username=current_user.username,
        summary=summary
    )