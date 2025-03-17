import claireAiImg from "@/public/claireai.png";
import libblioImg from "@/public/libblio.png";
import telloImg from "@/public/tello.png";
import quantaLedgerImg from "@/public/quantaledger.jpg";
import React from "react";
import { CgWorkAlt } from "react-icons/cg";
import { LuGraduationCap } from "react-icons/lu";

export const links = [
  {
    name: "Home",
    hash: "#home",
  },
  {
    name: "About",
    hash: "#about",
  },
  {
    name: "Projects",
    hash: "#projects",
  },
  {
    name: "Skills",
    hash: "#skills",
  },
  {
    name: "Experience",
    hash: "#experience",
  },
  {
    name: "Contact",
    hash: "#contact",
  },
] as const;

export const experiencesData = [
  {
    title: "Rwanda Coding Academy",
    location: "Rwanda",
    description:
      "3 years of intensive training in computer science, web development and embedded systems",
    icon: React.createElement(LuGraduationCap),
    date: "2022",
  },
  {
    title: "Backend developer, Libblio",
    location: "Rwanda",
    description:
      "I worked on the backend of a robust library management system system that helped schools have digitalised libraries",
    icon: React.createElement(CgWorkAlt),
    date: "2023 - 2024",
  },
] as const;

export const projectsData = [
  {
    title: "Libblio",
    description:
      "I worked on the backend of a robust library management system system that helped schools have digitalised libraries",
    tags: ["Nodejs", "GraphQL", "Prisma", "Sentry", "MySQL"],
    imageUrl: libblioImg,
  },
  {
    title: "Claire AI",
    description:
      "I worked on an AI tutor project designed to help students learn faster through a more engaging and personalized experience. My work involved integrating large language models into voice applications and implementing Retrieval-Augmented Generation (RAG) to minimize hallucinations and ensure accurate, high-quality learning content.",
    tags: ["RAG", "AI agents", "Langchain"],
    imageUrl: claireAiImg,
  },
  {
    title: "Quantaledger",
    description:
      "I worked on a project leveraging blockchain technology to enhance traceability in the supply chain. I implemented a private blockchain and integrated it with a Spring Boot backend, ensuring high performance and scalability.",
    tags: ["Hyperledger Fabric", "Kafka", "Spring Boot", "Java", "Redis"],
    imageUrl: quantaLedgerImg,
  },
  {
    title: "Tello AI",
    description:
      "I worked on a project that leveraged Small Language Models (SLMs) to make interacting with USSD codes more convenient. The system processed voice and text inputs in natural language to determine the appropriate USSD codes for a given task. My role involved fine-tuning a small language model on USSD-related data and optimizing it for on-device execution using quantization.",
    tags: ["Transformers", "Hugging face", "Unsloth", "SFT", "Llama.cpp"],
    imageUrl: telloImg,
  },
] as const;

export const skillsData = [
  "Node.js",
  "NestJS",
  "FastAPI",
  "Fastify",
  "Java",
  "Spring Boot",
  "Go",
  "Gin",
  "Python",
  "Django",
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Expo",
  "HTML",
  "CSS",
  "Tailwind",
  "GraphQL",
  "Apollo",
  "PostgreSQL",
  "MongoDB",
  "Prisma",
  "Express",
  "Git",
  "AWS",
  "Docker",
  "Terraform",
  "ArgoCD",
  "Istio",
  "Kubernetes",
  "Blockchain",
  "Smart Contracts",
  "Ethereum",
  "Hyperledger Fabric",
  "Machine Learning",
  "AI",
  "Natural Language Processing (NLP)",
  "Large Language Models (LLMs)",
  "Retrieval-Augmented Generation (RAG)",
  "Hugging Face",
  "Quantization",
  "Edge AI",
  "Speech-to-Text",
  "Fine Tuning"
] as const;

