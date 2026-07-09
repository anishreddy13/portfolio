const fs = require('fs');
let en = JSON.parse(fs.readFileSync('messages/en.json'));
en.Footer = {
  description: "Full-stack developer crafting bold digital experiences at the intersection of ",
  description_highlight: "design and engineering.",
  nav: "Navigation",
  connect: "Connect",
  legal: "Legal",
  about: "About",
  projects: "Projects",
  contact: "Contact",
  privacy: "Privacy",
  terms: "Terms"
};
fs.writeFileSync('messages/en.json', JSON.stringify(en, null, 2));

let de = JSON.parse(fs.readFileSync('messages/de.json'));
de.Footer = {
  description: "Full-Stack-Entwickler, der mutige digitale Erlebnisse an der Schnittstelle von ",
  description_highlight: "Design und Engineering schafft.",
  nav: "Navigation",
  connect: "Verbinden",
  legal: "Rechtliches",
  about: "Über mich",
  projects: "Projekte",
  contact: "Kontakt",
  privacy: "Datenschutz",
  terms: "Bedingungen"
};
fs.writeFileSync('messages/de.json', JSON.stringify(de, null, 2));
