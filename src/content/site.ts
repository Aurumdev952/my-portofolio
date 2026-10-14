// Every visible string and project lives here.
// Assumptions to confirm with the owner:
// - Years for Claire AI, Tello AI and Quantaledger are not on the CV, so they are left out.
// - Government projects use generic names and abstract art (no real screens or data).

export const site = {
  name: 'Ishimwe Mugisha Benjamin',
  shortName: 'Benjamin',
  initials: 'IMB',
  role: 'Software engineer',
  line: 'I build backends that hold under load, and I teach machines to help people learn.',
  url: (import.meta.env?.VITE_SITE_URL as string | undefined) ?? 'https://ishbenjamin.is-a.dev',
  description:
    'Ishimwe Mugisha Benjamin, software engineer in Kigali. Real time backends, data pipelines, Kubernetes and RAG systems for products and public services.',
  location: 'Kigali, Rwanda',
  coords: '1.9441° S, 30.0619° E',
  email: 'benjamugi20072@gmail.com',
  socials: [
    { label: 'GitHub', href: 'https://github.com/Aurumdev952' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/benjamin-ishimwe-mugisha' },
  ],
  available: 'Open to backend, platform and AI engineering work',
} as const

export type Chapter = {
  id: string
  year: string
  title: string
  body: string
  facts: string[]
  /** forge state the figure reaches by the end of this chapter, 0 = silhouette, 1 = real */
  forge: number
}

export const chapters: Chapter[] = [
  {
    id: 'spark',
    year: '2022',
    title: 'The spark',
    body:
      'At Rwanda Coding Academy I found out that I like knowing how things work all the way down: the circuit, the kernel, the query plan.',
    facts: ['Rwanda Coding Academy, Nyabihu', 'Software programming', 'Embedded systems', 'Cybersecurity'],
    forge: 0.2,
  },
  {
    id: 'break',
    year: '2024',
    title: 'Break it to understand it',
    body:
      'Reverse engineering taught me to read other people’s systems before I trust my own. Our team took first place in the high school division of picoCTF Africa.',
    facts: ['picoCTF Africa, 1st place', '1,500+ participants', 'Reverse engineering', 'Binary exploitation'],
    forge: 0.4,
  },
  {
    id: 'production',
    year: '2025',
    title: 'Into production',
    body:
      'Then real users. Visitor check in, e-commerce, a national registry interface. I learned that tests, schemas and boring migrations are what keep a system alive.',
    facts: ['NestJS with TDD, 85%+ coverage', 'Spring Boot and RabbitMQ', 'PostgreSQL tuning, 40% less lag'],
    forge: 0.6,
  },
  {
    id: 'scale',
    year: '2025 to now',
    title: 'Built to scale',
    body:
      'Today I run backends where latency is the product: live driver tracking, a wallet ledger, notification gateways that process more than ten thousand actions a day.',
    facts: ['PostGIS geospatial indexes', 'WebSockets in real time', 'Kubernetes at 99.9% uptime', 'Query latency down 35%'],
    forge: 0.8,
  },
  {
    id: 'ai',
    year: '2026',
    title: 'Teaching machines to teach',
    body:
      'Now I build AI that has to be right. UWERA is a tutor for Rwandan students, grounded by retrieval so it answers from the curriculum, not from its imagination.',
    facts: ['RAG with open source LLMs', '45% fewer hallucinations', 'Multi turn context engine', '30% more weekly engagement'],
    forge: 1,
  },
]

export type StackItem = { name: string; icon: string; note?: string }
export type StackGroup = { id: string; label: string; items: StackItem[] }

// icon = simple-icons slug, or a custom key handled in src/content/logos.ts
export const stack: StackGroup[] = [
  {
    id: 'languages',
    label: 'Languages',
    items: [
      { name: 'Python', icon: 'python' },
      { name: 'TypeScript', icon: 'typescript' },
      { name: 'JavaScript', icon: 'javascript' },
      { name: 'Java', icon: 'openjdk' },
      { name: 'Go', icon: 'go' },
      { name: 'SQL', icon: 'custom:sql' },
      { name: 'PHP', icon: 'php' },
      { name: 'C++', icon: 'cplusplus' },
      { name: 'C', icon: 'c' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    items: [
      { name: 'Node.js', icon: 'nodedotjs' },
      { name: 'NestJS', icon: 'nestjs' },
      { name: 'Express', icon: 'express' },
      { name: 'Fastify', icon: 'fastify' },
      { name: 'Spring Boot', icon: 'springboot' },
      { name: 'Spring Security', icon: 'springsecurity' },
      { name: 'FastAPI', icon: 'fastapi' },
      { name: 'Django', icon: 'django' },
      { name: 'Laravel', icon: 'laravel' },
      { name: 'Gin', icon: 'gin' },
      { name: 'GraphQL', icon: 'graphql' },
      { name: 'WebSockets', icon: 'socketdotio' },
      { name: 'Prisma', icon: 'prisma' },
    ],
  },
  {
    id: 'data',
    label: 'Data and messaging',
    items: [
      { name: 'PostgreSQL', icon: 'postgresql' },
      { name: 'PostGIS', icon: 'custom:postgis' },
      { name: 'MySQL', icon: 'mysql' },
      { name: 'MongoDB', icon: 'mongodb' },
      { name: 'Redis', icon: 'redis' },
      { name: 'Polars', icon: 'polars' },
      { name: 'Parquet', icon: 'apacheparquet' },
      { name: 'Kafka', icon: 'apachekafka' },
      { name: 'RabbitMQ', icon: 'rabbitmq' },
      { name: 'JSON Schema', icon: 'json' },
    ],
  },
  {
    id: 'ai',
    label: 'AI',
    items: [
      { name: 'Hugging Face', icon: 'huggingface' },
      { name: 'LangChain', icon: 'langchain' },
      { name: 'PyTorch', icon: 'pytorch' },
      { name: 'Unsloth', icon: 'custom:unsloth' },
      { name: 'llama.cpp', icon: 'custom:llamacpp' },
      { name: 'Milvus', icon: 'milvus' },
      { name: 'Pinecone', icon: 'custom:pinecone' },
      { name: 'ONNX', icon: 'onnx' },
    ],
  },
  {
    id: 'platform',
    label: 'Cloud and DevOps',
    items: [
      { name: 'Docker', icon: 'docker' },
      { name: 'Kubernetes', icon: 'kubernetes' },
      { name: 'k3s', icon: 'k3s' },
      { name: 'AWS', icon: 'custom:aws' },
      { name: 'DigitalOcean', icon: 'digitalocean' },
      { name: 'Cloudflare Workers', icon: 'cloudflareworkers' },
      { name: 'Terraform', icon: 'terraform' },
      { name: 'Ansible', icon: 'ansible' },
      { name: 'Argo CD', icon: 'argo' },
      { name: 'Istio', icon: 'istio' },
      { name: 'GitHub Actions', icon: 'githubactions' },
      { name: 'Git', icon: 'git' },
      { name: 'Ubuntu', icon: 'ubuntu' },
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend and immersive',
    items: [
      { name: 'React', icon: 'react' },
      { name: 'Next.js', icon: 'nextdotjs' },
      { name: 'React Native', icon: 'react' },
      { name: 'Expo', icon: 'expo' },
      { name: 'Vue', icon: 'vuedotjs' },
      { name: 'Tailwind CSS', icon: 'tailwindcss' },
      { name: 'Unity', icon: 'unity' },
      { name: 'Ethereum', icon: 'ethereum' },
      { name: 'Hyperledger Fabric', icon: 'custom:hyperledger' },
    ],
  },
]

export type ProjectArt = 'routes' | 'tutor' | 'pipeline' | 'vault' | 'mesh' | 'gate' | 'ledger' | 'voice' | 'library' | 'agency'

export type Project = {
  slug: string
  title: string
  org: string
  period: string
  role: string
  kind: ('AI' | 'Backend' | 'Infra' | 'Public sector')[]
  summary: string
  context: string
  built: string[]
  outcome: string[]
  stack: string[]
  link?: { label: string; href: string }
  /** screenshot shown on the holo screen and as the case study hero */
  image?: { src: string; mobile?: string; alt: string; w: number; h: number }
  /** abstract system art used when there is no public screen */
  art: ProjectArt
  /** shown as a station on the home page */
  featured?: boolean
}

export const projects: Project[] = [
  {
    slug: 'tujyane',
    title: 'Tujyane',
    org: 'Tujyane Ltd',
    period: 'Sep 2025 to now',
    role: 'Backend and DevOps engineer',
    kind: ['Backend', 'Infra'],
    summary: 'A multi tenant ride, booking and delivery platform with live tracking and its own wallet.',
    context:
      'Tujyane puts rides, trip booking and shopping in one app. That means many tenants, real time drivers on a map, and money moving between riders, drivers and merchants every minute.',
    built: [
      'The multi tenant booking ecosystem: real time data flows, geofenced routing and event loops across services.',
      'A transactional wallet engine with an automatic payment ledger.',
      'WebSocket geocoding updates and notification gateways for SMS, email and push.',
      'PostGIS and PostgreSQL query and index tuning for location lookups.',
    ],
    outcome: [
      '20% fewer data sync and processing exceptions after the ledger rewrite.',
      '10,000+ actions a day handled by the notification layer.',
      'Faster location lookups behind live driver tracking.',
    ],
    stack: ['NestJS', 'PostgreSQL', 'PostGIS', 'Redis', 'WebSockets', 'Docker', 'Kubernetes'],
    link: { label: 'tujyaneltd.com', href: 'https://tujyaneltd.com/' },
    image: { src: '/projects/tujyane-desktop.webp', mobile: '/projects/tujyane-mobile.webp', alt: 'Tujyane website: one app to get a ride, book a trip and shop, shown on three phones', w: 1600, h: 1000 },
    art: 'routes',
    featured: true,
  },
  {
    slug: 'uwera-ai',
    title: 'UWERA AI Tutor',
    org: 'Rwanda Coding Academy',
    period: 'Mar 2026 to now',
    role: 'AI engineer',
    kind: ['AI'],
    summary: 'A conversational tutor for Rwandan students, grounded in the curriculum with retrieval.',
    context:
      'Students need answers they can trust. A general chatbot invents things. UWERA has to stay inside the curriculum, remember the conversation, and run on open source models.',
    built: [
      'Retrieval augmented generation pipelines over course material, with open source LLMs.',
      'A multi turn context engine that keeps long tutoring sessions coherent.',
      'Multi provider model APIs, file storage and chat history persistence behind a Next.js interface.',
    ],
    outcome: ['45% fewer hallucinations from the language model.', '30% higher weekly engagement.'],
    stack: ['Python', 'FastAPI', 'Next.js', 'LangChain', 'Hugging Face', 'Milvus', 'PostgreSQL'],
    link: { label: 'uwera.rw', href: 'https://uwera.rw/' },
    image: { src: '/projects/uwera-desktop.webp', mobile: '/projects/uwera-mobile.webp', alt: 'UWERA website: AI powered learning built for every student, with two students working on a laptop', w: 1600, h: 1000 },
    art: 'tutor',
    featured: true,
  },
  {
    slug: 'uzabox',
    title: 'Uzabox',
    org: 'Uzabox Ltd',
    period: 'Apr 2025 to May 2026',
    role: 'Full stack developer',
    kind: ['Backend', 'Infra'],
    summary: 'E-commerce interfaces and a pipeline that ships the whole stack to client servers.',
    context:
      'Uzabox takes organisations digital. Some clients want the cloud, some want everything on their own servers, and every one of them wants dashboards that do not lag.',
    built: [
      'Responsive web and mobile e-commerce interfaces in React on a NestJS backend.',
      'A software distribution pipeline that deploys the stack to on premise and cloud infrastructure automatically.',
      'PostgreSQL query and schema tuning for analytics dashboards.',
    ],
    outcome: ['25% better mobile conversion.', '40% less dashboard lag on high throughput analytics.'],
    stack: ['React', 'NestJS', 'PostgreSQL', 'Docker', 'Ansible', 'GitHub Actions'],
    link: { label: 'uzabox.com', href: 'https://uzabox.com/' },
    image: { src: '/projects/uzabox-desktop.webp', mobile: '/projects/uzabox-mobile.webp', alt: 'Uzabox website: all your organisation’s services going digital, next to a desktop computer', w: 1600, h: 1000 },
    art: 'pipeline',
    featured: true,
  },
  {
    slug: 'regulation-platform',
    title: 'National regulation platform',
    org: 'Loxotech Ltd',
    period: 'Apr 2025 to Mar 2026',
    role: 'Software engineer',
    kind: ['Backend', 'Infra', 'Public sector'],
    summary: 'A secure, always on backend for a national regulator, with a columnar analytics pipeline.',
    context:
      'A regulator needs one place for records that must be correct, auditable and available under unpredictable public load. Screens stay private, so this page shows the system, not the UI.',
    built: [
      'The secure backend architecture and REST API layers, built for regulatory compliance.',
      'Data pipelines in Python with Polars and Parquet behind a dynamic analytics platform.',
      'CI/CD and high availability Kubernetes environments, co managed with the team.',
    ],
    outcome: ['30% faster query processing in the analytics pipeline.', '99.9% uptime under variable public sector load.'],
    stack: ['Python', 'Polars', 'Parquet', 'PostgreSQL', 'Kubernetes', 'GitHub Actions'],
    art: 'vault',
    featured: true,
  },
  {
    slug: 'dual-tvet-mis',
    title: 'Dual TVET MIS',
    org: 'Rwanda TVET Board',
    period: 'Jul 2025 to Apr 2026',
    role: 'Backend developer',
    kind: ['Backend', 'Public sector'],
    summary: 'Microservices that connect students, schools, companies and state registries.',
    context:
      'Dual TVET places students in companies while they study. Every placement touches state registries and a legal agreement between institutions, which used to mean paper and backlogs.',
    built: [
      'Co developed the microservices architecture with Spring Boot, PostgreSQL and RabbitMQ.',
      'Interoperability APIs with the SDMS and TMIS registries to fetch and validate student and teacher records.',
      'A contract engine that drafts, stamps, digitally signs and audits MoUs between institutions and industry partners.',
    ],
    outcome: ['60% smaller administrative processing backlog.'],
    stack: ['Java', 'Spring Boot', 'Spring Security', 'PostgreSQL', 'RabbitMQ', 'Docker'],
    art: 'mesh',
    featured: true,
  },
  {
    slug: 'visitor-management',
    title: 'Visitor Management System',
    org: 'QT Global Software',
    period: 'Apr 2025 to Oct 2025',
    role: 'Software development intern',
    kind: ['Backend'],
    summary: 'Check in flows and backend features for a central visitor management system.',
    context: 'Front desks lose time on every visitor. The check in flow had to be fast and the data had to be right.',
    built: [
      'High performance visitor check in flows and backend features in NestJS.',
      'Test driven development with team wide code reviews.',
      'Schema and REST API optimisation for safe transactional reads.',
    ],
    outcome: ['35% faster processing at check in.', 'Unit and integration coverage kept above 85%.'],
    stack: ['NestJS', 'TypeScript', 'PostgreSQL', 'Jest'],
    art: 'gate',
    featured: true,
  },
  {
    slug: 'tello-ai',
    title: 'Tello AI',
    org: 'Personal project',
    period: 'Small language model',
    role: 'ML engineer',
    kind: ['AI'],
    summary: 'A small language model that turns plain speech into the right USSD code, on device.',
    context: 'USSD menus are how many people in Rwanda pay, top up and check balances. Remembering codes is hard. Asking in your own words is not.',
    built: [
      'Fine tuned a small language model on USSD tasks with Unsloth and supervised fine tuning.',
      'Quantised it to run on device with llama.cpp.',
      'Voice and text input mapped to the correct code for the task.',
    ],
    outcome: ['Runs locally, no server round trip for a code lookup.'],
    stack: ['Hugging Face', 'Unsloth', 'llama.cpp', 'Python'],
    image: { src: '/projects/tello.webp', alt: 'Tello AI interface turning a spoken request into a USSD code', w: 1600, h: 596 },
    art: 'voice',
  },
  {
    slug: 'claire-ai',
    title: 'Claire AI',
    org: 'AI tutor project',
    period: 'Voice tutor',
    role: 'AI engineer',
    kind: ['AI'],
    summary: 'A voice first AI tutor that uses retrieval to keep lessons accurate.',
    context: 'Learning by talking is faster for many students, but a voice tutor that guesses is worse than none.',
    built: ['Integrated large language models into voice applications.', 'Implemented RAG to reduce hallucinations and keep content accurate.'],
    outcome: ['Lessons answered from course content instead of model memory.'],
    stack: ['Python', 'LangChain', 'RAG', 'Speech to text'],
    image: { src: '/projects/claireai.webp', alt: 'Claire AI tutor interface', w: 1600, h: 729 },
    art: 'tutor',
  },
  {
    slug: 'quantaledger',
    title: 'Quantaledger',
    org: 'Supply chain project',
    period: 'Blockchain',
    role: 'Backend engineer',
    kind: ['Backend'],
    summary: 'Supply chain traceability on a private blockchain behind a Spring Boot backend.',
    context: 'When goods change hands many times, every party needs the same record and nobody should be able to rewrite it.',
    built: ['A private Hyperledger Fabric network.', 'Integration with a Spring Boot backend, Kafka and Redis.'],
    outcome: ['A shared, tamper evident product history, with the performance and scale of a Spring Boot service.'],
    stack: ['Hyperledger Fabric', 'Spring Boot', 'Java', 'Kafka', 'Redis'],
    image: { src: '/projects/quantaledger.webp', alt: 'Quantaledger supply chain dashboard', w: 1600, h: 900 },
    art: 'ledger',
  },
  {
    slug: 'libblio',
    title: 'Libblio',
    org: 'Libblio',
    period: '2023 to 2024',
    role: 'Backend developer',
    kind: ['Backend'],
    summary: 'The backend of a library management system that put school libraries online.',
    context: 'School libraries ran on paper cards. Books went missing and nobody knew who had what.',
    built: ['A GraphQL API on Node.js with Prisma and MySQL.', 'Error tracking with Sentry.'],
    outcome: ['Schools got digital libraries instead of paper cards.'],
    stack: ['Node.js', 'GraphQL', 'Prisma', 'MySQL', 'Sentry'],
    image: { src: '/projects/libblio.webp', alt: 'Libblio library management dashboard', w: 1365, h: 630 },
    art: 'library',
  },
]

export const featured = projects.filter((p) => p.featured)

export const experience = [
  { org: 'Tujyane Ltd', role: 'Backend and DevOps engineer', period: 'Sep 2025 to now' },
  { org: 'Atomiq Ltd', role: 'Software engineer', period: 'Oct 2025 to now' },
  { org: 'Rwanda Coding Academy', role: 'AI engineer', period: 'Mar 2026 to now' },
  { org: 'Rwanda TVET Board', role: 'Backend developer', period: 'Jul 2025 to Apr 2026' },
  { org: 'Loxotech Ltd', role: 'Software engineer', period: 'Apr 2025 to Mar 2026' },
  { org: 'Uzabox Ltd', role: 'Full stack developer', period: 'Apr 2025 to May 2026' },
  { org: 'QT Global Software', role: 'Software development intern', period: 'Apr 2025 to Oct 2025' },
]

export const nav = [
  { label: 'Story', to: '/', hash: 'story' },
  { label: 'Work', to: '/work' },
  { label: 'Contact', to: '/', hash: 'contact' },
] as const
