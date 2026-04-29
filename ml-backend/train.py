import pandas as pd
import numpy as np
from datasets import load_dataset
from model import build_pipeline, save_model, clean_text
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import nltk

nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')

def load_data():
    print("Loading dataset from HuggingFace datasets library (no API needed)...")
    # Loads Twitter sentiment dataset directly from the datasets library
    dataset = load_dataset("tweet_eval", "sentiment")

    train_data = dataset['train']
    test_data = dataset['test']

    train_df = pd.DataFrame({
        'text': train_data['text'],
        'label': train_data['label']
    })

    test_df = pd.DataFrame({
        'text': test_data['text'],
        'label': test_data['label']
    })

    print(f"Train size: {len(train_df)}")
    print(f"Test size: {len(test_df)}")
    print(f"Label distribution:\n{train_df['label'].value_counts()}")

    return train_df, test_df

def train():
    print("=" * 50)
    print("SENTIMENT ANALYSIS MODEL TRAINING")
    print("=" * 50)

    # Load data
    train_df, test_df = load_data()

    # Clean text
    print("\nCleaning text data...")
    train_df['cleaned'] = train_df['text'].apply(clean_text)
    test_df['cleaned'] = test_df['text'].apply(clean_text)

    # Remove empty rows after cleaning
    train_df = train_df[train_df['cleaned'].str.strip() != '']
    test_df = test_df[test_df['cleaned'].str.strip() != '']

    X_train = train_df['cleaned'].values
    y_train = train_df['label'].values
    X_test = test_df['cleaned'].values
    y_test = test_df['label'].values

    # Build and train
    print("\nTraining model...")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # Evaluate
    print("\nEvaluating model...")
    y_pred = pipeline.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(
        y_test,
        y_pred,
        target_names=['Negative', 'Neutral', 'Positive']
    ))

    # Save model
    save_model(pipeline)
    print("\nTraining complete!")

    # Quick test
    test_sentences = [
        "I absolutely love this product, it's amazing!",
        "This is the worst experience I've ever had.",
        "The package arrived today.",
        "Feeling great about the new update!",
        "I hate waiting so long for nothing.",
    ]

    print("\nQuick prediction test:")
    print("-" * 40)
    from model import predict_sentiment
    for sentence in test_sentences:
        result = predict_sentiment(sentence, pipeline)
        print(f"Text: {sentence[:50]}...")
        print(f"Sentiment: {result['sentiment']} ({result['confidence']}% confident)")
        print()

if __name__ == "__main__":
    train()