export interface Certificate {
  id: number;
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  image: string;
  verifyUrl: string;
  color: string;
  category: string;
  skills: string[];
  description: string;
}

export const certificates: Certificate[] = [
  {
    id: 1,
    title: "Machine Learning Specialization",
    issuer: "Coursera / DeepLearning.AI",
    date: "August 2023",
    credentialId: "CRED-ML-001",
    image: "/certificates/cert-1.jpg",
    verifyUrl: "#",
    color: "#C8FF00",
    category: "ML",
    skills: ["Python", "Neural Networks", "TensorFlow", "ML"],
    description: "Foundational machine learning concepts including supervised and unsupervised learning.",
  },
  {
    id: 2,
    title: "Deep Learning Specialization",
    issuer: "Coursera / DeepLearning.AI",
    date: "October 2023",
    credentialId: "CRED-DL-002",
    image: "/certificates/cert-2.jpg",
    verifyUrl: "#",
    color: "#A855F7",
    category: "ML",
    skills: ["CNN", "RNN", "LSTM", "PyTorch"],
    description: "Advanced neural network architectures and sequence models for computer vision and NLP.",
  },
  {
    id: 3,
    title: "AWS Cloud Practitioner",
    issuer: "Amazon Web Services",
    date: "December 2023",
    credentialId: "CRED-AWS-003",
    image: "/certificates/cert-3.jpg",
    verifyUrl: "#",
    color: "#FF6B35",
    category: "Cloud",
    skills: ["AWS", "Cloud Architecture", "S3", "EC2"],
    description: "Fundamental cloud computing concepts and AWS infrastructure services.",
  },
  {
    id: 4,
    title: "Data Science Professional Certificate",
    issuer: "IBM / Coursera",
    date: "February 2024",
    credentialId: "CRED-DS-004",
    image: "/certificates/cert-4.jpg",
    verifyUrl: "#",
    color: "#FF6B35",
    category: "Data",
    skills: ["Python", "Pandas", "SQL", "Visualization"],
    description: "Comprehensive data science pipeline from data gathering to exploratory analysis and presentation.",
  },
  {
    id: 5,
    title: "TensorFlow Developer Certificate",
    issuer: "Google",
    date: "April 2024",
    credentialId: "CRED-TF-005",
    image: "/certificates/cert-5.jpg",
    verifyUrl: "#",
    color: "#C8FF00",
    category: "ML",
    skills: ["TensorFlow", "Keras", "Computer Vision", "NLP"],
    description: "Applied machine learning and deep learning using TensorFlow across various domains.",
  },
  {
    id: 6,
    title: "Full Stack Development",
    issuer: "freeCodeCamp",
    date: "June 2024",
    credentialId: "CRED-FS-006",
    image: "/certificates/cert-6.jpg",
    verifyUrl: "#",
    color: "#FF2D2D",
    category: "Web",
    skills: ["React", "Node.js", "MongoDB", "APIs"],
    description: "End-to-end web application development covering responsive design and backend logic.",
  }
];
