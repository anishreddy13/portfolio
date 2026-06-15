export interface Certificate {
  id: number;
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  image: string;
  verifyUrl: string;
  color: string;
  category: string[];
  skills: string[];
  description: string;
}

export const certificates: Certificate[] = [
  {
    id: 1,
    title: "Machine Learning Statistical Foundations Professional Certificate",
    issuer: "Wolfram Research",
    date: "August 2025",
    credentialId: "N/A",
    image: "/certificates/cert-1.jpg",
    verifyUrl: "https://www.linkedin.com/learning/certificates/3de8d1da87cc308a20d39520d6cbe7a9557660d33a84bb4aff0b3e8ecec6ebf4",
    color: "#C8FF00",
    category: ["ML", "Data"],
    skills: ["Wolfram Language", "Calculus", "Statistical Analysis", "Linear Algebra"],
    description: "Statistical foundations for Machine Learning.",
  },
  {
    id: 2,
    title: "AWS Certified AI Practitioner",
    issuer: "Amazon Web Services (AWS)",
    date: "July 2025",
    credentialId: "19aaca76-c660-4aaf-85e7-6251d3883550",
    image: "/certificates/cert-2.jpg",
    verifyUrl: "https://www.credly.com/badges/19aaca76-c660-4aaf-85e7-6251d3883550/linked_in_profile",
    color: "#FF6B35",
    category: ["AI", "ML", "Cloud"],
    skills: ["Generative AI", "Artificial Intelligence", "Machine Learning", "AI and ML on AWS (Foundational)", "Amazon Web Services", "AWS Certification", "AWS Cloud"],
    description: "Foundational AI and ML concepts on AWS.",
  },
  {
    id: 3,
    title: "NSDC Certified Data Science Certificate",
    issuer: "National Skill Development Corporation (NSDC)",
    date: "December 2023",
    credentialId: "07fc2e4e",
    image: "/certificates/cert-3.jpg",
    verifyUrl: "https://trainings.internshala.com/s/v/3384822/07fc2e4e",
    color: "#A855F7",
    category: ["Data", "ML"],
    skills: ["Data Analysis", "Microsoft Excel", "Machine Learning", "Tableau", "Data Science", "Data Visualization"],
    description: "Comprehensive data science certificate including data analysis, ML, and visualization.",
  },
  {
    id: 4,
    title: "Machine Learning",
    issuer: "Internshala",
    date: "November 2023",
    credentialId: "440949fa",
    image: "/certificates/cert-4.jpg",
    verifyUrl: "https://trainings.internshala.com/s/v/3180393/440949fa",
    color: "#C8FF00",
    category: ["ML"],
    skills: ["Machine Learning"],
    description: "Machine Learning concepts and applications.",
  },
  {
    id: 5,
    title: "Tableau",
    issuer: "Internshala",
    date: "October 2023",
    credentialId: "9512415e",
    image: "/certificates/cert-5.jpg",
    verifyUrl: "https://trainings.internshala.com/s/v/3170145/9512415e",
    color: "#FF2D2D",
    category: ["Data"],
    skills: ["Tableau", "Data Visualization"],
    description: "Data visualization and analytics using Tableau.",
  },
  {
    id: 6,
    title: "SQL",
    issuer: "Internshala",
    date: "October 2023",
    credentialId: "f0qpncep4k0",
    image: "/certificates/cert-6.jpg",
    verifyUrl: "https://trainings.internshala.com/view_certificate/7wdyuv05ivt/f0qpncep4k0/",
    color: "#FF6B35",
    category: ["Data"],
    skills: ["SQL", "Database Management"],
    description: "Database management and SQL querying.",
  },
  {
    id: 7,
    title: "Excel",
    issuer: "Internshala",
    date: "October 2023",
    credentialId: "24c982rk7sb",
    image: "/certificates/cert-7.jpg",
    verifyUrl: "https://trainings.internshala.com/view_certificate/700sa1y4rke/24c982rk7sb/",
    color: "#A855F7",
    category: ["Data"],
    skills: ["Microsoft Excel", "Spreadsheet Analysis"],
    description: "Advanced spreadsheet analysis and data management with Microsoft Excel.",
  }
];
