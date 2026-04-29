import nltk
import re
import joblib
import numpy as np
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.calibration import CalibratedClassifierCV

nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'\b\d+\b', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    tokens = text.split()
    tokens = [
        lemmatizer.lemmatize(word)
        for word in tokens
        if word not in stop_words and len(word) > 2
    ]
    return ' '.join(tokens)

def build_spam_pipeline() -> Pipeline:
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            sublinear_tf=True
        )),
        ('clf', CalibratedClassifierCV(
            MultinomialNB(alpha=0.1)
        ))
    ])
    return pipeline

def save_spam_model(pipeline: Pipeline, path: str = 'spam_model.pkl'):
    joblib.dump(pipeline, path)
    print(f"Spam model saved to {path}")

def load_spam_model(path: str = 'spam_model.pkl') -> Pipeline:
    return joblib.load(path)

def predict_spam(text: str, pipeline: Pipeline):
    cleaned = clean_text(text)
    prediction = pipeline.predict([cleaned])[0]
    probabilities = pipeline.predict_proba([cleaned])[0]
    classes = list(pipeline.classes_)

    label_map = {
        0: 'Not Spam',
        1: 'Spam',
        'ham': 'Not Spam',
        'spam': 'Spam',
        0.0: 'Not Spam',
        1.0: 'Spam'
    }

    pred_key = prediction
    if hasattr(prediction, 'item'):
        pred_key = prediction.item()

    label = label_map.get(pred_key, str(prediction))
    confidence = round(float(max(probabilities)) * 100, 2)

    scores = {}
    for cls, prob in zip(classes, probabilities):
        cls_key = cls
        if hasattr(cls, 'item'):
            cls_key = cls.item()
        display = label_map.get(cls_key, str(cls))
        scores[display] = round(float(prob) * 100, 2)

    # Spam indicators — words that triggered detection
    spam_keywords = [
        'free', 'win', 'winner', 'cash', 'prize', 'claim',
        'urgent', 'congratulations', 'offer', 'click', 'deal',
        'discount', 'limited', 'guaranteed', 'risk', 'credit',
        'loan', 'money', 'buy', 'cheap', 'earn', 'income'
    ]
    found_keywords = [
        word for word in spam_keywords
        if word in text.lower()
    ]

    return {
        'label': label,
        'confidence': confidence,
        'scores': scores,
        'spam_keywords_found': found_keywords,
        'cleaned_text': cleaned,
        'is_spam': label == 'Spam'
    }