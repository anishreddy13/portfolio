const fs = require('fs');

let en = JSON.parse(fs.readFileSync('messages/en.json'));
en.Certificates = {
  tag: '05 / Credentials',
  heading1: 'CONTINUOUS',
  heading_highlight: 'LEARNING',
  description: 'A collection of technical certifications and specialized training in machine learning, cloud architecture, and software engineering.',
  no_cert: 'No certificates found',
  issuer: 'ISSUER',
  date: 'DATE',
  credential_id: 'CREDENTIAL ID',
  skills: 'SKILLS COVERED',
  verified: 'VERIFIED',
  verify: 'Verify ↗',
  verify_full: 'Verify Credential ↗',
  close: 'Close',
  filter_all: 'All',
  filter_ai: 'AI',
  filter_ml: 'ML',
  filter_data: 'Data',
  filter_cloud: 'Cloud'
};
fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2));

let de = JSON.parse(fs.readFileSync('messages/de.json'));
de.Certificates = {
  tag: '05 / Qualifikationen',
  heading1: 'KONTINUIERLICHES',
  heading_highlight: 'LERNEN',
  description: 'Eine Sammlung von technischen Zertifizierungen und spezialisiertem Training in den Bereichen maschinelles Lernen, Cloud-Architektur und Software-Engineering.',
  no_cert: 'Keine Zertifikate gefunden',
  issuer: 'AUSSTELLER',
  date: 'DATUM',
  credential_id: 'ZERTIFIKATS-ID',
  skills: 'ERWORBENE FÄHIGKEITEN',
  verified: 'VERIFIZIERT',
  verify: 'Verifizieren ↗',
  verify_full: 'Zertifikat verifizieren ↗',
  close: 'Schließen',
  filter_all: 'Alle',
  filter_ai: 'KI',
  filter_ml: 'ML',
  filter_data: 'Daten',
  filter_cloud: 'Cloud'
};
fs.writeFileSync('messages/de.json', JSON.stringify(de, null, 2));
