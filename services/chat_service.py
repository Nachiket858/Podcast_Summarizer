
import os
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate

class ChatService:
    def __init__(self):
        # We no longer need vector store paths or embeddings for direct context injection
        pass

    def get_chat_response(self, context, user_query):
        """
        Generates a response using the provided context and user query.
        Directly feeds the context into the LLM prompt.
        """
        try:
            if not context:
                return "I don't have enough information to answer that."

            # Truncate context if strictly necessary, but assuming Llama 3.2 1B or similar 
            # has enough context for typical podcast lengths or we accept some valid cutoff.
            # Local Ollama usually handles context management or truncation gracefully.
            
            # Simple summarization/QA prompt
            llm = ChatOllama(
                model=os.getenv("OLLAMA_MODEL", "gpt-oss:latest"),
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                temperature=0.7
            )
            
            prompt = PromptTemplate.from_template("""
           You are an assistant that answers questions only using the provided podcast summary.

            Podcast Summary:
            {context}

            User Question:
            {question}

            Rules:

            Respond clearly, simply, and concisely.

            Always reply in English.

            Only answer questions that can be answered using the podcast summary.

            Do not add external knowledge, assumptions, or interpretations.

            If the answer is not present in the podcast summary, reply exactly with:
            "I don't know based on this podcast."

            If the user greets you (e.g., "hi", "hello", "hey"), respond politely and briefly.
            """)
            
            response = llm.invoke(prompt.format(context=context, question=user_query))
            return response.content
            
        except Exception as e:
            print(f"Chat error: {e}")
            return "Sorry, I encountered an error processing your request."
