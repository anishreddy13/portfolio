import pandas as pd
from datasets import load_dataset
from spam_model import build_spam_pipeline, save_spam_model, clean_text, predict_spam
from sklearn.metrics import classification_report, accuracy_score
import nltk

nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')

def load_data():
    print("Loading SMS Spam dataset from HuggingFace...")
    dataset = load_dataset("sms_spam")

    # Convert to dataframe
    train_test = dataset['train'].train_test_split(test_size=0.2, seed=42)

    train_df = pd.DataFrame({
        'text': train_test['train']['sms'],
        'label': train_test['train']['label']
    })

    test_df = pd.DataFrame({
        'text': train_test['test']['sms'],
        'label': train_test['test']['label']
    })

    print(f"Train size: {len(train_df)}")
    print(f"Test size: {len(test_df)}")
    print(f"\nLabel distribution:")
    label_map = {0: 'ham (Not Spam)', 1: 'spam (Spam)'}
    print(train_df['label'].map(label_map).value_counts())

    return train_df, test_df

def train():
    print("=" * 50)
    print("SPAM DETECTOR MODEL TRAINING")
    print("=" * 50)

    train_df, test_df = load_data()

    print("\nCleaning text data...")
    train_df['cleaned'] = train_df['text'].apply(clean_text)
    test_df['cleaned'] = test_df['text'].apply(clean_text)

    train_df = train_df[train_df['cleaned'].str.strip() != '']
    test_df = test_df[test_df['cleaned'].str.strip() != '']

    X_train = train_df['cleaned'].values
    y_train = train_df['label'].values
    X_test = test_df['cleaned'].values
    y_test = test_df['label'].values

    print("\nTraining model...")
    pipeline = build_spam_pipeline()
    pipeline.fit(X_train, y_train)

    print("\nEvaluating model...")
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nAccuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(
        y_test,
        y_pred,
        target_names=['Not Spam', 'Spam']
    ))

    save_spam_model(pipeline)
    print("\nTraining complete!")

    test_messages = [
        "Congratulations! You've won a FREE iPhone. Click here to claim your prize NOW!",
        "Hey, are we still meeting for lunch tomorrow?",
        "URGENT: Your account has been compromised. Send your password immediately.",
        "Can you pick up some groceries on your way home?",
        "Win £1000 cash prize! Text WIN to 87121. Limited time offer!",
        "The meeting has been rescheduled to 3pm on Friday.",
        "FREE entry to win FA Cup Final tickets! Text FA to 87121",
        "I'll be home late tonight, don't wait up for dinner.",
    ]

    print("\nQuick prediction test:")
    print("-" * 50)
    for msg in test_messages:
        result = predict_spam(msg, pipeline)
        print(f"Message: {msg[:60]}...")
        print(f"Result:  {result['label']} ({result['confidence']}% confident)")
        if result['spam_keywords_found']:
            print(f"Keywords found: {result['spam_keywords_found']}")
        print()

if __name__ == "__main__":
    train()