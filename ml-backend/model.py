import nltk
import re
import joblib
import numpy as np
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r'http\S+|www\S+', '', text)
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    tokens = text.split()
    tokens = [
        lemmatizer.lemmatize(word)
        for word in tokens
        if word not in stop_words and len(word) > 2
    ]
    return ' '.join(tokens)

def build_pipeline() -> Pipeline:
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=10000,
            ngram_range=(1, 2),
            sublinear_tf=True
        )),
        ('clf', LogisticRegression(
            max_iter=1000,
            C=1.0,
            solver='lbfgs'
        ))
    ])
    return pipeline

def save_model(pipeline: Pipeline, path: str = 'sentiment_model.pkl'):
    joblib.dump(pipeline, path)
    print(f"Model saved to {path}")

def load_model(path: str = 'sentiment_model.pkl') -> Pipeline:
    return joblib.load(path)

def predict_sentiment(text: str, pipeline: Pipeline):
    cleaned = clean_text(text)
    prediction = pipeline.predict([cleaned])[0]
    probabilities = pipeline.predict_proba([cleaned])[0]
    classes = pipeline.classes_

    label_map = {
        0: 'Negative',
        1: 'Neutral',
        2: 'Positive',
        'negative': 'Negative',
        'neutral': 'Neutral',
        'positive': 'Positive'
    }

    sentiment = label_map.get(int(prediction), str(prediction))
    confidence = round(float(max(probabilities)) * 100, 2)

    # Convert keys and values to plain Python types — fixes numpy.int64 error
    confidence_scores = {}
    for cls, prob in zip(classes, probabilities):
        label = label_map.get(int(cls), str(cls))
        confidence_scores[label] = round(float(prob) * 100, 2)

    return {
        'sentiment': sentiment,
        'confidence': confidence,
        'scores': confidence_scores,
        'cleaned_text': cleaned
    }