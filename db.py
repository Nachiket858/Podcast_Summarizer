# db.py
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['Podcast_Summarizer']
users_collection = db['users']
summaries_collection = db['summaries']
history_collection = db['history']