const fs = require('fs');

let en = JSON.parse(fs.readFileSync('messages/en.json'));
en.Plant = {
  header: 'Plant Disease Detector',
  desc: 'Upload a leaf image to diagnose diseases across 38 crop-disease pairs using a custom PyTorch CNN model.',
  upload: 'Upload Leaf Image',
  browse: 'or click to browse',
  supported: 'Supported formats: JPG, PNG',
  processing: 'Processing Image...',
  analyzing: 'Running Inference...',
  analyze_btn: 'Analyze Leaf',
  disease: 'Detected Disease',
  healthy: 'Healthy',
  probability: 'Probability',
  disease_class: 'Disease Class',
  recommendation: 'Recommendation',
  treatment: 'Apply recommended fungicide and ensure proper watering.',
  treatment_healthy: 'Maintain current care routine.',
  try_sample: 'Try Sample'
};

en.Interview = {
  header: 'AI Interview Coach',
  desc: 'Real-time speech analysis that evaluates confidence, pacing, filler words, and technical accuracy.',
  start: 'Start Interview',
  stop: 'Stop Recording',
  processing: 'Processing...',
  speak_now: 'Speak now, we are analyzing your response...',
  transcription: 'Transcription',
  results: 'Analysis Results',
  confidence: 'Confidence Score',
  pacing: 'Pacing (WPM)',
  filler: 'Filler Words',
  clarity: 'Clarity Score',
  feedback: 'AI Feedback',
  feedback_text: 'Good pacing, but try to reduce filler words like "um" and "uh". Your technical explanation was clear and concise.'
};

fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2));

let de = JSON.parse(fs.readFileSync('messages/de.json'));
de.Plant = {
  header: 'Pflanzenkrankheits-Detektor',
  desc: 'Laden Sie ein Blattbild hoch, um Krankheiten bei 38 Paarungen aus Nutz- und Krankheitsarten mit einem speziellen PyTorch-CNN-Modell zu diagnostizieren.',
  upload: 'Blattbild hochladen',
  browse: 'oder klicken, um zu durchsuchen',
  supported: 'Unterstützte Formate: JPG, PNG',
  processing: 'Bild wird verarbeitet...',
  analyzing: 'Inferenz wird ausgeführt...',
  analyze_btn: 'Blatt analysieren',
  disease: 'Erkannte Krankheit',
  healthy: 'Gesund',
  probability: 'Wahrscheinlichkeit',
  disease_class: 'Krankheitsklasse',
  recommendation: 'Empfehlung',
  treatment: 'Empfohlenes Fungizid anwenden und auf angemessene Bewässerung achten.',
  treatment_healthy: 'Aktuelle Pflegeroutine beibehalten.',
  try_sample: 'Beispiel testen'
};

de.Interview = {
  header: 'KI-Interview-Coach',
  desc: 'Echtzeit-Sprachanalyse zur Bewertung von Konfidenz, Sprechtempo, Füllwörtern und technischer Genauigkeit.',
  start: 'Interview starten',
  stop: 'Aufnahme stoppen',
  processing: 'Wird verarbeitet...',
  speak_now: 'Sprechen Sie jetzt, wir analysieren Ihre Antwort...',
  transcription: 'Transkription',
  results: 'Analyseergebnisse',
  confidence: 'Konfidenz-Score',
  pacing: 'Sprechtempo (WpM)',
  filler: 'Füllwörter',
  clarity: 'Klarheits-Score',
  feedback: 'KI-Feedback',
  feedback_text: 'Gutes Sprechtempo, aber versuchen Sie, Füllwörter wie "ähm" zu reduzieren. Ihre technische Erklärung war klar und präzise.'
};

fs.writeFileSync('messages/de.json', JSON.stringify(de, null, 2));
