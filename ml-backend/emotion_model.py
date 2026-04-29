import nltk
import re
import joblib
import numpy as np
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.multiclass import OneVsRestClassifier

nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

# All 20 emotions the model can detect
EMOTIONS = [
    'admiration', 'amusement', 'anger', 'annoyance', 'approval',
    'caring', 'confusion', 'curiosity', 'desire', 'disappointment',
    'disapproval', 'disgust', 'embarrassment', 'excitement', 'fear',
    'gratitude', 'grief', 'joy', 'love', 'nervousness',
    'optimism', 'pride', 'realization', 'relief', 'remorse',
    'sadness', 'surprise', 'neutral'
]

# Emotion to emoji mapping
EMOTION_EMOJI = {
    'admiration': '🤩', 'amusement': '😄', 'anger': '😡',
    'annoyance': '😤', 'approval': '👍', 'caring': '🤗',
    'confusion': '😕', 'curiosity': '🤔', 'desire': '😍',
    'disappointment': '😞', 'disapproval': '👎', 'disgust': '🤢',
    'embarrassment': '😳', 'excitement': '🤩', 'fear': '😨',
    'gratitude': '🙏', 'grief': '😢', 'joy': '😊',
    'love': '❤️', 'nervousness': '😰', 'optimism': '😁',
    'pride': '😎', 'realization': '💡', 'relief': '😮‍💨',
    'remorse': '😔', 'sadness': '😭', 'surprise': '😲',
    'neutral': '😐'
}

# Emotion color categories for UI
EMOTION_COLORS = {
    'joy': '#00f5ff', 'love': '#00f5ff', 'admiration': '#00f5ff',
    'amusement': '#00f5ff', 'excitement': '#00f5ff', 'gratitude': '#00f5ff',
    'approval': '#00f5ff', 'caring': '#00f5ff', 'optimism': '#00f5ff',
    'pride': '#00f5ff', 'relief': '#00f5ff',
    'anger': '#ec4899', 'annoyance': '#ec4899', 'disapproval': '#ec4899',
    'disgust': '#ec4899', 'fear': '#ec4899', 'grief': '#ec4899',
    'sadness': '#ec4899', 'disappointment': '#ec4899', 'remorse': '#ec4899',
    'embarrassment': '#ec4899',
    'confusion': '#8b5cf6', 'curiosity': '#8b5cf6', 'desire': '#8b5cf6',
    'nervousness': '#8b5cf6', 'realization': '#8b5cf6', 'surprise': '#8b5cf6',
    'neutral': '#64748b'
}

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'[^a-zA-Z\s!?.,]', '', text)
    tokens = text.split()
    tokens = [
        lemmatizer.lemmatize(word)
        for word in tokens
        if word not in stop_words and len(word) > 1
    ]
    return ' '.join(tokens)

def build_emotion_pipeline() -> Pipeline:
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=15000,
            ngram_range=(1, 3),
            sublinear_tf=True,
            min_df=2
        )),
        ('clf', LogisticRegression(
            max_iter=1000,
            C=2.0,
            solver='lbfgs',
            class_weight='balanced'
        ))
    ])
    return pipeline

def build_gender_pipeline() -> Pipeline:
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=8000,
            ngram_range=(1, 2),
            sublinear_tf=True
        )),
        ('clf', LogisticRegression(
            max_iter=500,
            C=1.0,
            solver='lbfgs'
        ))
    ])
    return pipeline

def build_age_pipeline() -> Pipeline:
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=8000,
            ngram_range=(1, 2),
            sublinear_tf=True
        )),
        ('clf', LogisticRegression(
            max_iter=500,
            C=1.0,
            solver='lbfgs'
        ))
    ])
    return pipeline

def save_emotion_models(emotion_pipeline, gender_pipeline, age_pipeline):
    joblib.dump(emotion_pipeline, 'emotion_model.pkl')
    joblib.dump(gender_pipeline, 'gender_model.pkl')
    joblib.dump(age_pipeline, 'age_model.pkl')
    print("All 3 models saved successfully!")

def load_emotion_models():
    emotion_pipeline = joblib.load('emotion_model.pkl')
    gender_pipeline = joblib.load('gender_model.pkl')
    age_pipeline = joblib.load('age_model.pkl')
    return emotion_pipeline, gender_pipeline, age_pipeline

def predict_emotion(text: str, emotion_pipeline, gender_pipeline, age_pipeline):
    cleaned = clean_text(text)

    # ── Emotion prediction ──────────────────────────────────────────
    emotion_pred = emotion_pipeline.predict([cleaned])[0]
    emotion_proba = emotion_pipeline.predict_proba([cleaned])[0]
    emotion_classes = emotion_pipeline.classes_

    top_emotions = []
    indices = np.argsort(emotion_proba)[::-1][:5]
    for idx in indices:
        top_emotions.append({
            'emotion': str(emotion_classes[idx]),
            'score': round(float(emotion_proba[idx]) * 100, 2),
            'emoji': EMOTION_EMOJI.get(str(emotion_classes[idx]), '😐'),
            'color': EMOTION_COLORS.get(str(emotion_classes[idx]), '#64748b')
        })

    primary_emotion = str(emotion_pred)
    emotion_confidence = round(float(max(emotion_proba)) * 100, 2)

    # ── Gender prediction ───────────────────────────────────────────
    gender_pred = gender_pipeline.predict([cleaned])[0]
    gender_proba = gender_pipeline.predict_proba([cleaned])[0]
    gender_classes = gender_pipeline.classes_

    gender_scores = {
        str(cls): round(float(prob) * 100, 2)
        for cls, prob in zip(gender_classes, gender_proba)
    }
    gender_label_map = {
        'male': 'Male', 'female': 'Female',
        'M': 'Male', 'F': 'Female',
        '0': 'Male', '1': 'Female'
    }
    gender = gender_label_map.get(str(gender_pred), str(gender_pred))
    gender_confidence = round(float(max(gender_proba)) * 100, 2)

    # ── Age prediction ──────────────────────────────────────────────
    age_pred = age_pipeline.predict([cleaned])[0]
    age_proba = age_pipeline.predict_proba([cleaned])[0]
    age_classes = age_pipeline.classes_

    age_scores = {
        str(cls): round(float(prob) * 100, 2)
        for cls, prob in zip(age_classes, age_proba)
    }
    age = str(age_pred)
    age_confidence = round(float(max(age_proba)) * 100, 2)

    return {
        'primary_emotion': primary_emotion,
        'emotion_emoji': EMOTION_EMOJI.get(primary_emotion, '😐'),
        'emotion_color': EMOTION_COLORS.get(primary_emotion, '#64748b'),
        'emotion_confidence': emotion_confidence,
        'top_emotions': top_emotions,
        'gender': gender,
        'gender_confidence': gender_confidence,
        'gender_scores': gender_scores,
        'age_group': age,
        'age_confidence': age_confidence,
        'age_scores': age_scores,
        'cleaned_text': cleaned
    }