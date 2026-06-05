export type QuestionCategory =
  | 'teamwork'
  | 'conflict'
  | 'leadership'
  | 'failure'
  | 'technical'
  | 'project'
  | 'growth'

export interface SdeQuestion {
  id: string
  category: QuestionCategory
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  hint: string
  followUps: string[]
}

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  teamwork:   '🤝 Teamwork',
  conflict:   '⚡ Conflict',
  leadership: '🎯 Leadership',
  failure:    '📉 Failure & Learning',
  technical:  '⚙️ Technical Decisions',
  project:    '🚀 Project Highlights',
  growth:     '🌱 Growth & Adaptability',
}

export const SDE_QUESTIONS: SdeQuestion[] = [
  // teamwork (4题)
  {
    id: 'tw-1',
    category: 'teamwork',
    difficulty: 'easy',
    question: 'Tell me about a time you worked effectively with a team to accomplish a difficult goal.',
    hint: 'Focus on your specific contribution (Action) and the measurable outcome (Result). Avoid saying "we" too much — interviewers want to know YOUR role.',
    followUps: [
      'What was the biggest challenge the team faced?',
      'What would you do differently if you could redo it?',
    ],
  },
  {
    id: 'tw-2',
    category: 'teamwork',
    difficulty: 'medium',
    question: 'Describe a situation where you had to collaborate with someone whose working style was very different from yours.',
    hint: 'Show empathy and adaptability. Emphasize what you learned about working with different personalities.',
    followUps: [
      'How did you adapt your communication style?',
      'Did this change how you approach future collaborations?',
    ],
  },
  {
    id: 'tw-3',
    category: 'teamwork',
    difficulty: 'medium',
    question: 'Tell me about a time your team missed a deadline. What was your role and what did you do?',
    hint: 'Be honest but constructive. Focus on what YOU did to help recover the situation, not on blaming others.',
    followUps: [
      'What early warning signs did you miss?',
      'What process changes did you implement afterward?',
    ],
  },
  {
    id: 'tw-4',
    category: 'teamwork',
    difficulty: 'hard',
    question: 'Give me an example of when you had to give difficult feedback to a teammate. How did you approach it?',
    hint: 'Show that you can be direct but kind. Mention how you prepared for the conversation and the outcome.',
    followUps: [
      'How did they react?',
      'Would you do anything differently?',
    ],
  },

  // conflict (4题)
  {
    id: 'cf-1',
    category: 'conflict',
    difficulty: 'medium',
    question: 'Tell me about a time you disagreed with your manager or a senior engineer about a technical approach. What did you do?',
    hint: 'Show that you can advocate for your view respectfully while also being willing to align with the team decision. Mention data or reasoning you used.',
    followUps: [
      'How did you ultimately resolve the disagreement?',
      'Looking back, who was right?',
    ],
  },
  {
    id: 'cf-2',
    category: 'conflict',
    difficulty: 'medium',
    question: 'Describe a time when you had competing priorities from different stakeholders. How did you decide what to work on first?',
    hint: 'Show a structured approach to prioritization — impact, urgency, stakeholder alignment. Mention how you communicated your decision.',
    followUps: [
      'Did any stakeholder push back on your decision?',
      'What framework do you use for prioritization?',
    ],
  },
  {
    id: 'cf-3',
    category: 'conflict',
    difficulty: 'hard',
    question: 'Tell me about a time you strongly disagreed with a product or business decision but had to implement it anyway.',
    hint: 'Show maturity — express that you voiced your concerns through proper channels, then committed once the decision was made.',
    followUps: [
      'How did you voice your concerns?',
      'How did the outcome turn out?',
    ],
  },
  {
    id: 'cf-4',
    category: 'conflict',
    difficulty: 'hard',
    question: 'Describe a situation where you had a conflict with a teammate that was affecting team productivity. How did you resolve it?',
    hint: "Focus on the process of resolution, not the other person's faults. Show emotional intelligence.",
    followUps: [
      'Did you involve your manager?',
      'How did the relationship evolve after the conflict?',
    ],
  },

  // leadership (4题)
  {
    id: 'ld-1',
    category: 'leadership',
    difficulty: 'easy',
    question: 'Tell me about a time you mentored or helped a junior teammate grow their skills.',
    hint: 'Be specific about what you taught, how you structured the mentoring, and the measurable improvement you saw.',
    followUps: [
      'How did you identify what they needed help with?',
      'Are you still in touch with them?',
    ],
  },
  {
    id: 'ld-2',
    category: 'leadership',
    difficulty: 'medium',
    question: 'Describe a time you led a project without having formal authority over the team.',
    hint: 'Show how you built trust and alignment through communication and expertise rather than title.',
    followUps: [
      'How did you get buy-in from team members?',
      'What was the most difficult part of leading without authority?',
    ],
  },
  {
    id: 'ld-3',
    category: 'leadership',
    difficulty: 'hard',
    question: 'Tell me about a time you had to make a critical decision with incomplete information and tight time constraints.',
    hint: 'Show your decision-making framework. Mention how you gathered what information you could, made the call, and handled the outcome.',
    followUps: [
      'What would you have done differently with more time?',
      'How do you typically handle ambiguity?',
    ],
  },
  {
    id: 'ld-4',
    category: 'leadership',
    difficulty: 'hard',
    question: "Give me an example of a time you identified a significant problem in your team's process and drove the change to fix it.",
    hint: 'Show initiative and ownership. Quantify the impact of the improvement.',
    followUps: [
      'How did you get the team to adopt the new process?',
      'What resistance did you face?',
    ],
  },

  // failure (4题)
  {
    id: 'fl-1',
    category: 'failure',
    difficulty: 'easy',
    question: 'Tell me about a time you received tough critical feedback. How did you handle it?',
    hint: 'Show self-awareness and growth mindset. Focus on what you changed as a result.',
    followUps: [
      'Did you agree with the feedback?',
      'How did it change your approach going forward?',
    ],
  },
  {
    id: 'fl-2',
    category: 'failure',
    difficulty: 'medium',
    question: 'Describe a time you made a mistake that had a real impact on users or your team. What happened?',
    hint: 'Be honest about the mistake. Emphasize what you did to mitigate the impact and what you changed to prevent recurrence.',
    followUps: [
      'How did you communicate the mistake to your team or manager?',
      'What would the "ideal" version of you have done differently?',
    ],
  },
  {
    id: 'fl-3',
    category: 'failure',
    difficulty: 'medium',
    question: 'Tell me about a project that failed or was cancelled. What was your role and what did you learn?',
    hint: 'Focus on intellectual honesty about why it failed and concrete lessons applied to future work.',
    followUps: [
      'Would you have made the same initial decision knowing what you know now?',
      'How did the team handle the disappointment?',
    ],
  },
  {
    id: 'fl-4',
    category: 'failure',
    difficulty: 'hard',
    question: 'Tell me about your biggest professional failure. What did you learn and how did it shape you?',
    hint: 'This is a character question. Be genuine and specific. The bigger the failure you can discuss openly, the more self-aware you appear.',
    followUps: [
      'How did it affect your confidence?',
      'How did you rebuild after it?',
    ],
  },

  // technical (4题)
  {
    id: 'tc-1',
    category: 'technical',
    difficulty: 'medium',
    question: 'Tell me about a time you had to choose between two technical solutions with very different trade-offs. How did you decide?',
    hint: 'Walk through your evaluation criteria — scalability, maintainability, time to ship, team expertise. Show structured thinking.',
    followUps: [
      'Were there constraints that narrowed your options?',
      'How did the chosen solution perform long-term?',
    ],
  },
  {
    id: 'tc-2',
    category: 'technical',
    difficulty: 'medium',
    question: 'Describe a time you had to significantly improve the performance of a system or feature.',
    hint: 'Quantify both the problem (X ms latency, Y% CPU) and the improvement. Show your diagnostic process.',
    followUps: [
      'How did you identify the bottleneck?',
      'What trade-offs did your optimization involve?',
    ],
  },
  {
    id: 'tc-3',
    category: 'technical',
    difficulty: 'hard',
    question: 'Give me an example of when you advocated for paying down technical debt. How did you make the case?',
    hint: 'Show business awareness — frame technical debt in terms of velocity, risk, or cost. Show how you got stakeholder buy-in.',
    followUps: [
      'How did you quantify the cost of the technical debt?',
      'Was it worth it in the end?',
    ],
  },
  {
    id: 'tc-4',
    category: 'technical',
    difficulty: 'medium',
    question: 'Tell me about a time you introduced a new technology or tool to your team. How did you drive adoption?',
    hint: 'Show both technical judgment (why this tool) and people skills (how you got the team on board).',
    followUps: [
      'What resistance did you face?',
      'Looking back, was it the right choice?',
    ],
  },

  // project (4题)
  {
    id: 'pj-1',
    category: 'project',
    difficulty: 'easy',
    question: "Tell me about a project you're most proud of. What was your specific contribution?",
    hint: 'Use concrete metrics. Distinguish clearly between what the team did and what you personally drove.',
    followUps: [
      'What was the most technically interesting part?',
      'What would you build differently now?',
    ],
  },
  {
    id: 'pj-2',
    category: 'project',
    difficulty: 'medium',
    question: "Describe the most technically challenging project you've worked on. What made it hard?",
    hint: 'Show depth — talk about the specific technical challenges, not just "it was complex." Mention how you broke down the problem.',
    followUps: [
      'What resources or people did you lean on?',
      "What would have happened if you hadn't solved it?",
    ],
  },
  {
    id: 'pj-3',
    category: 'project',
    difficulty: 'medium',
    question: 'Tell me about a time you shipped a feature or product under significant time pressure.',
    hint: 'Show how you made scope and quality trade-offs under pressure. Show that you still delivered something valuable.',
    followUps: [
      'What did you cut or defer?',
      'Were you satisfied with the result?',
    ],
  },
  {
    id: 'pj-4',
    category: 'project',
    difficulty: 'hard',
    question: 'Give me an example of a feature or product decision that had significant user impact. How did you measure success?',
    hint: 'Show product thinking — tie your engineering work to user outcomes and business metrics.',
    followUps: [
      'How did you define the success metric?',
      'Did the data surprise you?',
    ],
  },

  // growth (4题)
  {
    id: 'gr-1',
    category: 'growth',
    difficulty: 'easy',
    question: 'Tell me about a time you had to quickly learn a new technology or skill for a project. How did you approach it?',
    hint: 'Show your learning process — how you broke it down, what resources you used, how quickly you became productive.',
    followUps: [
      'How long did it take to feel confident?',
      'Do you still use this skill today?',
    ],
  },
  {
    id: 'gr-2',
    category: 'growth',
    difficulty: 'easy',
    question: "Describe a time you proactively sought feedback on your work, even though it wasn't required.",
    hint: 'Show genuine hunger for growth. Mention what you did with the feedback you received.',
    followUps: [
      'Was the feedback what you expected?',
      'How did you decide who to ask?',
    ],
  },
  {
    id: 'gr-3',
    category: 'growth',
    difficulty: 'medium',
    question: 'Tell me about a time you had to adapt to a major unexpected change — in team structure, technology, or direction.',
    hint: 'Show resilience and flexibility. Focus on how you helped yourself and others adapt, not just on the frustration.',
    followUps: [
      'How did the change affect team morale?',
      'What did the experience teach you about adaptability?',
    ],
  },
  {
    id: 'gr-4',
    category: 'growth',
    difficulty: 'medium',
    question: 'Tell me how you stay current with new developments in software engineering. Give me a recent example.',
    hint: 'Be specific — name a paper, blog post, conference talk, or project you explored recently. Generic answers like "I read tech blogs" are weak.',
    followUps: [
      "Have you applied anything you've learned recently to your work?",
      'How do you filter signal from noise in the tech world?',
    ],
  },
]
