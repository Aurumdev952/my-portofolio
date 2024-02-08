"use client";

import React from "react";
import SectionHeading from "./section-heading";
import { motion } from "framer-motion";
import { useSectionInView } from "@/lib/hooks";

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
        I started coding at an eary age which gave me time to explore{" "}
        <span className="font-medium">Full stack developement</span>, I decided to pursue backend developement since I felt more comfortable doing it. I enrolled in a coding focused high school in my country where I can pursue my passion{" "}
        <span className="font-medium">
          Nodejs, Spring boot and AWS
        </span>
        . I am also familiar with technologies like <span className="font-medium">Microservices</span> and <span className="font-medium">Serverless</span>
      </p>

      <p>
        <span className="italic">When I'm not coding</span>, I enjoy playing
        video games, watching movies, and surfing the iternet. I also enjoy{" "}
        <span className="font-medium">learning new things</span>. I am currently
        learning about{" "}
        <span className="font-medium">game designing</span>. I'm also
        learning how to dance.
      </p>
    </motion.section>
  );
}
