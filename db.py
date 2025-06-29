# db.py
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['Podcast_Summarizer']
users_collection = db['users']