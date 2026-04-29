import pandas as pd
import numpy as np
from datasets import load_dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from emotion_model import (
    clean_text,
    build_emotion_pipeline,
    build_gender_pipeline,
    build_age_pipeline,
    save_emotion_models,
    predict_emotion,
    EMOTION_EMOJI
)
import nltk

nltk.download('stopwords')
nltk.download('wordnet')
nltk.download('omw-1.4')


def load_emotion_data():
    print("Loading GoEmotions dataset (28 emotions, 58k+ Reddit comments)...")
    dataset = load_dataset("go_emotions", "simplified")

    train_df = pd.DataFrame({
        'text': dataset['train']['text'],
        'labels': dataset['train']['labels']
    })
    test_df = pd.DataFrame({
        'text': dataset['test']['text'],
        'labels': dataset['test']['labels']
    })

    # Take the first label for multi-label entries
    train_df['label'] = train_df['labels'].apply(
        lambda x: x[0] if len(x) > 0 else 27
    )
    test_df['label'] = test_df['labels'].apply(
        lambda x: x[0] if len(x) > 0 else 27
    )

    # Get label names
    label_names = dataset['train'].features['labels'].feature.names

    train_df['emotion'] = train_df['label'].apply(lambda x: label_names[x])
    test_df['emotion'] = test_df['label'].apply(lambda x: label_names[x])

    print(f"Train size: {len(train_df)}")
    print(f"Test size: {len(test_df)}")
    print(f"Unique emotions: {train_df['emotion'].nunique()}")
    print(f"\nTop 10 emotions:\n{train_df['emotion'].value_counts().head(10)}")

    return train_df, test_df


def create_gender_data():
    print("\nCreating gender classification data from Blog Authorship Corpus...")
    try:
        dataset = load_dataset("blog_authorship_corpus", trust_remote_code=True)
        df = pd.DataFrame({
            'text': dataset['train']['text'][:20000],
            'gender': dataset['train']['gender'][:20000]
        })
        df = df[df['gender'].isin(['male', 'female'])]
        df = df.dropna()
        print(f"Gender data size: {len(df)}")
        print(f"Distribution:\n{df['gender'].value_counts()}")
        return df
    except Exception as e:
        print(f"Blog corpus failed ({e}), generating synthetic gender data...")
        return generate_synthetic_gender_data()


def generate_synthetic_gender_data():
    male_texts = [
        "I love watching football and playing video games",
        "Just finished my workout at the gym, feeling strong",
        "The new car model is amazing, great horsepower",
        "Watched the game last night, incredible performance",
        "Building a new PC setup this weekend",
        "The motorcycle ride was incredible today",
        "Fishing trip was a success caught three bass",
        "Deadlifted my personal best today at the gym",
        "The stock market analysis shows strong gains",
        "Playing poker with the guys tonight",
        "Fixed the engine myself, saved a lot of money",
        "The new graphics card is absolutely insane",
        "Went hiking in the mountains this weekend",
        "Barbecue was perfect, ribs came out great",
        "Fantasy football draft is coming up soon",
    ] * 200

    female_texts = [
        "Just got my nails done, love the new color",
        "Yoga class was so relaxing and peaceful today",
        "Found the perfect dress for the wedding",
        "Made homemade cookies for the family gathering",
        "The skincare routine has been working wonders",
        "Had brunch with my girlfriends, such a lovely time",
        "Redecorating the living room with new cushions",
        "The baby shower was absolutely beautiful",
        "Tried a new recipe for dinner tonight amazing",
        "Shopping for new fall clothes this weekend",
        "The spa treatment was incredibly relaxing",
        "Made a vision board for my goals this year",
        "Book club meeting was so inspiring today",
        "The flower arrangement came out beautifully",
        "Journaling every morning has changed my life",
    ] * 200

    texts = male_texts + female_texts
    labels = ['male'] * len(male_texts) + ['female'] * len(female_texts)

    df = pd.DataFrame({'text': texts, 'gender': labels})
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    print(f"Synthetic gender data: {len(df)} samples")
    return df


def create_age_data():
    print("\nCreating age group classification data...")
    child_texts = [
        "I want to play with my toys and watch cartoons",
        "My teacher gave us homework today at school",
        "I love drawing pictures and coloring books",
        "Can we go to the playground after school please",
        "My favorite cartoon character is so funny",
        "I got a gold star from my teacher today",
        "Playing hide and seek with my friends",
        "I want a puppy for my birthday please",
        "Story time before bed is my favorite",
        "I drew a picture of our family today",
    ] * 150

    teenager_texts = [
        "This new song is literally so fire right now",
        "School is so boring I cannot wait for summer",
        "My parents just do not understand me at all",
        "Hanging out with friends at the mall today",
        "Social media is everything in high school",
        "Studying for finals is absolutely killing me",
        "Crushes are so complicated and confusing",
        "Just got my driver's license finally freedom",
        "Prom is coming up and I am so excited",
        "College applications are stressing me out",
    ] * 150

    adult_texts = [
        "Work meeting ran late again today exhausting",
        "Mortgage payment is due at the end of the month",
        "Taking the kids to soccer practice after work",
        "Annual performance review went really well",
        "Planning a vacation for the family this summer",
        "Investment portfolio is looking strong this quarter",
        "Project deadline is tomorrow need to finish report",
        "Networking event was very productive tonight",
        "Hired a new team member starting next Monday",
        "Working from home has changed my daily routine",
    ] * 150

    elderly_texts = [
        "My grandchildren visited us this weekend lovely",
        "Doctor appointment went well blood pressure good",
        "Back in my day things were much simpler",
        "Retirement has been the best decision I made",
        "Garden is blooming beautifully this spring season",
        "Reminiscing about the good old days with friends",
        "Medicare coverage questions are so confusing now",
        "Senior center bingo night was so much fun",
        "Arthritis is acting up with this cold weather",
        "Wrote letters to my grandchildren this week",
    ] * 150

    texts = child_texts + teenager_texts + adult_texts + elderly_texts
    labels = (
        ['Child'] * len(child_texts) +
        ['Teenager'] * len(teenager_texts) +
        ['Adult'] * len(adult_texts) +
        ['Elderly'] * len(elderly_texts)
    )

    df = pd.DataFrame({'text': texts, 'age_group': labels})
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    print(f"Age group data: {len(df)} samples")
    print(f"Distribution:\n{df['age_group'].value_counts()}")
    return df


def train():
    print("=" * 60)
    print("EMOTION + GENDER + AGE CLASSIFICATION TRAINING")
    print("=" * 60)

    # ── Train Emotion Model ─────────────────────────────────────────
    print("\n[1/3] Training Emotion Model...")
    train_df, test_df = load_emotion_data()

    train_df['cleaned'] = train_df['text'].apply(clean_text)
    test_df['cleaned'] = test_df['text'].apply(clean_text)
    train_df = train_df[train_df['cleaned'].str.strip() != '']
    test_df = test_df[test_df['cleaned'].str.strip() != '']

    emotion_pipeline = build_emotion_pipeline()
    emotion_pipeline.fit(train_df['cleaned'].values, train_df['emotion'].values)

    y_pred = emotion_pipeline.predict(test_df['cleaned'].values)
    emotion_accuracy = accuracy_score(test_df['emotion'].values, y_pred)
    print(f"Emotion Model Accuracy: {emotion_accuracy * 100:.2f}%")
    print(classification_report(
        test_df['emotion'].values, y_pred, zero_division=0
    ))

    # ── Train Gender Model ──────────────────────────────────────────
    print("\n[2/3] Training Gender Model...")
    gender_df = create_gender_data()
    gender_df['cleaned'] = gender_df['text'].apply(clean_text)
    gender_df = gender_df[gender_df['cleaned'].str.strip() != '']

    X_gender = gender_df['cleaned'].values
    y_gender = gender_df['gender'].values
    X_g_train, X_g_test, y_g_train, y_g_test = train_test_split(
        X_gender, y_gender, test_size=0.2, random_state=42, stratify=y_gender
    )

    gender_pipeline = build_gender_pipeline()
    gender_pipeline.fit(X_g_train, y_g_train)

    y_g_pred = gender_pipeline.predict(X_g_test)
    gender_accuracy = accuracy_score(y_g_test, y_g_pred)
    print(f"Gender Model Accuracy: {gender_accuracy * 100:.2f}%")
    print(classification_report(y_g_test, y_g_pred))

    # ── Train Age Model ─────────────────────────────────────────────
    print("\n[3/3] Training Age Model...")
    age_df = create_age_data()
    age_df['cleaned'] = age_df['text'].apply(clean_text)
    age_df = age_df[age_df['cleaned'].str.strip() != '']

    X_age = age_df['cleaned'].values
    y_age = age_df['age_group'].values
    X_a_train, X_a_test, y_a_train, y_a_test = train_test_split(
        X_age, y_age, test_size=0.2, random_state=42, stratify=y_age
    )

    age_pipeline = build_age_pipeline()
    age_pipeline.fit(X_a_train, y_a_train)

    y_a_pred = age_pipeline.predict(X_a_test)
    age_accuracy = accuracy_score(y_a_test, y_a_pred)
    print(f"Age Model Accuracy: {age_accuracy * 100:.2f}%")
    print(classification_report(y_a_test, y_a_pred))

    # ── Save all 3 models ───────────────────────────────────────────
    save_emotion_models(emotion_pipeline, gender_pipeline, age_pipeline)

    # ── Quick test all 3 together ───────────────────────────────────
    print("\n" + "=" * 60)
    print("QUICK PREDICTION TEST — ALL 3 MODELS")
    print("=" * 60)

    test_sentences = [
        "I am so incredibly happy today everything is perfect!",
        "I cannot believe they did this to me I am absolutely furious",
        "I miss my grandmother so much it hurts every single day",
        "Oh my gosh I had no idea this would happen what a shock!",
        "I am really scared about the surgery tomorrow morning",
        "Thank you so much for everything you have done for me",
        "I just got promoted at work finally all the hard work paid off",
        "This situation is making me feel really anxious and worried",
    ]

    for sentence in test_sentences:
        result = predict_emotion(
            sentence, emotion_pipeline, gender_pipeline, age_pipeline
        )
        print(f"\nText: {sentence[:60]}...")
        print(f"  Emotion:  {result['emotion_emoji']} {result['primary_emotion'].upper()} ({result['emotion_confidence']}%)")
        print(f"  Gender:   {result['gender']} ({result['gender_confidence']}%)")
        print(f"  Age:      {result['age_group']} ({result['age_confidence']}%)")

    print("\n✅ All models trained and saved successfully!")


if __name__ == "__main__":
    train()