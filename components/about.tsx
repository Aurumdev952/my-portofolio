"use client";

import { useSectionInView } from "@/lib/hooks";
import { motion } from "framer-motion";
import SectionHeading from "./section-heading";

export default function About() {
  const { ref } = useSectionInView("About");

  return (
    <motion.section
      ref={ref}
      className="mb-28 max-w-[45rem] text-center leading-8 sm:mb-40 scroll-mt-28"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.175 }}
      id="about"
    >
      <SectionHeading>About me</SectionHeading>
      <p className="mb-3">
        I started coding at an early age, which gave me the opportunity to
        explore <span className="font-medium">Full-Stack Development</span>.
        Over time, I gravitated toward{" "}
        <span className="font-medium">Backend Development</span>, where I found
        my true passion for building scalable and efficient systems. I enrolled
        in a coding-focused high school in my country, allowing me to deepen my
        expertise in{" "}
        <span className="font-medium">Node.js, Spring Boot, and AWS</span>.
        Along the way, I’ve also gained experience with{" "}
        <span className="font-medium">Microservices</span>,{" "}
        <span className="font-medium">Serverless Architectures</span>, and{" "}
        <span className="font-medium">Cloud Computing</span>.
      </p>

      <p className="mb-3">
        Recently, I’ve been diving deep into the world of{" "}
        <span className="font-medium">Large Language Models (LLMs)</span> and{" "}
        <span className="font-medium">AI Agents</span>. I’ve worked on
        integrating LLMs into{" "}
        <span className="font-medium">voice applications</span> and optimizing{" "}
        <span className="font-medium">Small Language Models (SLMs)</span> for
        edge devices using <span className="font-medium">quantization</span>.
        I’m particularly fascinated by{" "}
        <span className="font-medium">
          Retrieval-Augmented Generation (RAG)
        </span>
        , which enhances AI responses by reducing hallucinations and improving
        factual accuracy. I love exploring how AI can create more{" "}
        <span className="font-medium">
          personalized, efficient, and engaging
        </span>{" "}
        digital experiences.
      </p>

      <p>
        <span className="italic">When I'm not coding</span>, you’ll likely find
        me playing video games, listening to music, watching movies, or going
        down internet rabbit holes. I have a strong curiosity for{" "}
        <span className="font-medium">learning new things</span>, and right now,
        I'm exploring <span className="font-medium">game design</span>—merging
        my love for technology with creativity. I believe in staying positive
        and embracing challenges as opportunities to grow.
      </p>
    </motion.section>
  );
}
