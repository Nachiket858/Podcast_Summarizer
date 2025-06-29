
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
import os
from db import db, users_collection

from home import home_bp  # ✅ Import your blueprint

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY') or 'dev-secret-key'


# Flask-Login setup
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.session_protection = "strong"
login_manager.init_app(app)

class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.username = user_data['username']
        self.password_hash = user_data['password']

@login_manager.user_loader
def load_user(user_id):
    try:
        user_data = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user_data:
            return None
        return User(user_data)
    except:
        return None

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if users_collection.find_one({'username': username}):
            flash('Username already exists')
            return redirect(url_for('signup'))
        
        users_collection.insert_one({
            'username': username,
            'password': generate_password_hash(password)
        })
        flash('Account created successfully! Please login.')
        return redirect(url_for('login'))
    
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user_data = users_collection.find_one({'username': username})
        
        if not user_data or not check_password_hash(user_data['password'], password):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        
        user = User(user_data)
        login_user(user, remember=True)
        next_page = request.args.get('next')
        return redirect(next_page) if next_page else redirect(url_for('home_bp.home'))  # ✅ Use blueprint name
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# ✅ Register the blueprint
app.register_blueprint(home_bp)

if __name__ == '__main__':
    app.run(debug=True)

