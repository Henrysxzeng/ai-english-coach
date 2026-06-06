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
  starExample: string
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
    starExample: "Sure. At my previous company, we were building a payments integration for a major client with a three-week deadline — our team of four had never worked together before. I was the tech lead. My task was to coordinate both the backend API work and frontend integration while keeping everyone aligned. I started by breaking the project into daily milestones on a shared board, assigned each person a clear ownership area, and set up a 15-minute standup every morning. When I noticed one teammate was blocked on a tricky OAuth flow, I jumped on a pair-programming session with her for two hours to unblock it. I also proactively flagged a scope risk to the PM two days before the deadline, which bought us one extra day for testing. We shipped on time, the integration went live with zero critical bugs, and the client signed a contract renewal the following week. The key was making sure nobody was blocked silently — I kept communication channels very open throughout.",
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
    starExample: "At my last job, I was paired with a backend engineer who was very detail-oriented and liked to write exhaustive design docs before writing any code. I'm more of a prototype-first person — I like to build something quickly and iterate. Early on we clashed because I'd start coding while he was still in the design phase, which made him uncomfortable. My task was to deliver a new data pipeline together within six weeks. I adapted by proposing a middle-ground process: a lightweight one-page design doc to align on key interfaces, then I'd build the first prototype while he refined the doc. I also started syncing with him more frequently so he felt informed. Once he trusted that I wasn't going to go completely off-track, he became much more comfortable. We shipped the pipeline on schedule, and our combined approach — quick prototype plus solid documentation — actually became the team's standard for future projects.",
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
    starExample: "This happened about a year ago. We were rebuilding our notification service before a major product launch, and we missed the initial deadline by a full week. I was the backend owner. Honestly, I underestimated the complexity of migrating the existing message queue — what I assumed was three days of work turned out to be seven. When it became clear we'd miss the date, I immediately flagged it to the PM rather than hoping we'd catch up. I took ownership of the critical path and asked two teammates to help me with lower-priority migration tasks. I worked extra hours that week to rewrite the most complex piece — a fanout mechanism that needed to handle 10K events per second. We launched seven days late, which pushed a marketing campaign but didn't affect users directly. After that, I introduced buffer days and explicit complexity checkpoints into our sprint planning, and we haven't had a major miss since.",
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
    starExample: "There was a situation where a teammate was consistently writing pull requests with very little test coverage — around 20 to 30 percent — while our team norm was 80 percent. It was slowing down code reviews because everyone else had to add tests before merging. I decided to address it directly rather than going to our manager. I prepared by collecting three specific PRs as examples and framing the conversation around team efficiency, not personal criticism. I asked if we could grab coffee and gave the feedback there — I said something like, 'I've noticed test coverage has been lower in your recent PRs, and I think it's creating extra review overhead for the team. I'd love to help if there's a blocker.' Turns out he was unclear on our testing standards. We pair-programmed for a session and I showed him our patterns. Within two sprints, his coverage was consistently above 80 percent and his PRs moved much faster through review.",
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
    starExample: "About eight months into my previous role, I disagreed with my manager about whether to build our new analytics feature as a microservice or keep it in the monolith. He wanted the microservice for isolation; I thought it was premature given our team size and would add operational complexity we weren't ready for. My task was to either make the case or accept his call. I wrote a short one-page technical memo comparing deployment overhead, on-call burden, and time-to-ship for both approaches. I pulled real data: our monolith had 99.9% uptime over the past year and a median deploy time of eight minutes. He reviewed it and agreed to start in the monolith but with a clear extraction trigger — if the service exceeded 10K queries per minute, we'd break it out. We shipped in the monolith and it worked great. We never hit that trigger, which retrospectively validated my position — though I also acknowledged his concern about isolation was completely legitimate.",
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
    starExample: "This happened during our Q3 planning cycle. I had three stakeholders each insisting their project was top priority: the growth team wanted a referral feature, the infrastructure team wanted a database migration, and the PM wanted a user onboarding redesign. My task was to allocate my team's six sprints across the quarter. I evaluated each against two dimensions: business impact — revenue or retention risk — and technical urgency — what breaks or slows us down if we defer it. The database migration scored highest on urgency because we were already hitting performance issues that would worsen. I scheduled it first. Then the onboarding redesign, because conversion data showed a 15 percent drop-off at a specific step. The referral feature went to Q4. I wrote up the rationale and shared it with all three stakeholders. The growth team pushed back initially, but once I showed the data, they agreed. We delivered all three projects eventually, just in a different order than originally requested.",
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
    starExample: "About a year ago, my company decided to sunset a developer tool with a small but loyal user base — about 2,000 monthly active users — in favor of focusing resources on enterprise customers. I personally disagreed. I thought we were leaving developer goodwill on the table and the tool had long-term strategic value. My role was to implement the deprecation flow: the sunset page, migration guide, and email campaign. I raised my concerns in the product review meeting with data: the developer segment had a disproportionately high NPS of 72 compared to our overall NPS of 45. Leadership acknowledged the point but decided the resource trade-off still favored the enterprise pivot. Once the decision was made, I committed fully. I focused my energy on making the deprecation as smooth as possible — I wrote a detailed migration guide, set up a Slack community for affected users, and personally responded to the first 50 support tickets. The feedback praised how gracefully we handled it, and we retained most of those users in some form.",
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
    starExample: "I had a conflict with a teammate that lasted about three weeks and was genuinely affecting our output. He and I had different ideas about code ownership: I believed shared ownership meant anyone could refactor anything; he felt you should ask before touching someone else's files. I changed some of his code without telling him, and he was upset. Rather than escalating to our manager, I asked for a one-on-one. I went in ready to listen first. He explained he'd been burned before by refactors that broke things without notice — that was completely fair. I apologized, and we agreed on a simple rule: flag significant changes in the PR description and @mention the original author. I also proposed we add a CODEOWNERS file to make ownership explicit. Within a week, the tension was gone and we were collaborating more closely than before. Our code review turnaround time actually improved by 30 percent because we stopped duplicating work in the same files.",
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
    starExample: "At my last company, I mentored a new grad who joined our team during a busy quarter. She was technically solid but struggled with our deployment process and code review culture. I noticed she was hesitant to open pull requests because she was afraid of criticism. My task was to help her get up to speed and build confidence. I set up weekly one-on-ones for the first month to review her in-progress work before she submitted it publicly, so she could fix things in a safe space. I gave her progressively larger tasks — first bug fixes, then small features, then a full API endpoint. Whenever I gave PR feedback, I framed it as 'here's one thing to consider' rather than a list of problems. After about six weeks, she started opening PRs independently without prompting. By her three-month mark, she was leading her own small feature end-to-end. She told me later that the low-pressure early feedback was the most helpful part. That experience shaped how I approach onboarding now.",
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
    starExample: "About a year ago, I led a cross-functional initiative to modernize our API authentication layer — moving from API keys to OAuth 2.0. This involved three teams: platform, mobile, and developer experience. I had no formal authority over any of them. My role was to deliver the migration in 10 weeks. The biggest challenge was getting all three teams to prioritize it over their own roadmaps. I started by making the case to each team lead individually with a specific ask — I came in with a timeline and a clear statement of what I needed in terms of engineering hours. I set up a weekly sync where I tracked progress publicly and celebrated small wins. When the mobile team got blocked on a token refresh issue, I wrote the reference implementation for them rather than just filing a ticket. By owning the ambiguous parts myself and making everyone else's contribution as clear as possible, I built trust without authority. We shipped the migration on week 11 — one week late — but with zero breaking changes for existing users.",
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
    starExample: "This happened during a live production incident last year. Our payment processing service started failing for about 20 percent of users, and we had roughly 30 minutes before a major sales event went live. We didn't know the root cause — our monitoring showed elevated error rates but the logs were ambiguous. I was the on-call lead. I had to decide: roll back the deployment we'd pushed three hours earlier, or keep investigating. A rollback would fix the symptoms if the deploy was the cause, but we'd lose two days of work and might not actually fix anything if the cause was elsewhere. With only 10 minutes of data and a hard deadline, I decided to roll back. The team executed it in under five minutes, and error rates dropped to zero within two minutes. We later confirmed it was indeed the deploy — a race condition in our database transaction handler. If I'd waited for certainty, we'd have had the incident during peak traffic. The lesson I took away: in production incidents, reversible actions under uncertainty beat inaction waiting for perfect information.",
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
    starExample: "About 18 months ago, I noticed our team's code review cycle was averaging five days — way too long, and features were getting delayed by the bottleneck. Nobody had explicitly flagged it, but I tracked it in our GitLab metrics and saw the pattern. My task was to fix it without adding bureaucratic overhead. I first interviewed five engineers to understand why reviews were slow. Three themes came up: PRs were too large, there was no clear SLA, and reviewers had no way to prioritize. I proposed a three-part solution: a PR size guideline of under 400 lines, a 24-hour first-response SLA tracked publicly, and a 'review requests' column in our sprint board. I got sign-off from my manager and ran a two-week experiment. Review cycle time dropped from five days to 1.8 days. We've maintained it ever since. The key insight was that nobody was being lazy — the system just didn't make expectations visible enough.",
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
    starExample: "About two years ago, my manager gave me feedback in a performance review that really stung at first. She said I had a tendency to 'go dark' during complex tasks — meaning I'd disappear into a problem for days without updating the team, and people didn't know if I was making progress or stuck. I was defensive initially — I felt like I was just focused. But I reflected on it and realized she was right. There had been at least two situations that quarter where teammates were waiting on my output and didn't know I was blocked. I made a specific change: I started posting a short daily update in our team Slack channel whenever I was on a multi-day task. Just two sentences — what I did and whether I was blocked. It felt awkward at first, but my manager noticed the change within three weeks and mentioned it positively. More importantly, two teammates told me they felt less anxious about their dependencies on me. That feedback shifted how I think about visible progress as part of the job, not just the actual output.",
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
    starExample: "A couple of years ago, I deployed a schema migration that added a NOT NULL column to a high-traffic table without a proper default value. I'd tested it locally and in staging, but I missed that staging had about 100 rows while production had 50 million. The migration locked the table for over four minutes during business hours, causing a partial outage for roughly 8,000 users. The moment I saw the error spike, I immediately alerted my manager and the on-call team, and we rolled back within six minutes. I took direct ownership in the postmortem — I wrote it myself and presented it to the team. The root cause was my failure to check the migration plan for large tables. As a result, I introduced a mandatory checklist for all schema migrations: estimate row count, add explicit DEFAULT, use pt-online-schema-change for tables over 1 million rows. That checklist has prevented at least three potential incidents since. The outage generated about 40 support tickets, and I personally reached out to five customers who were severely affected.",
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
    starExample: "About a year and a half ago, I spent three months building a real-time collaboration feature for our product — think Google Docs-style simultaneous editing. It got cancelled two weeks before launch because the product team decided the core user need could be solved with a simpler async commenting system instead. I was the project lead. Honestly, the cancellation was the right call, but it was a painful moment for me and the two engineers who helped me build it. I had gotten so focused on the engineering problem that I never went back and challenged the product requirement. I'd never asked: 'Are users actually blocked because of lack of real-time collaboration, or is this a nice-to-have?' That was a gap in my product thinking. The lesson I took forward was to spend the first sprint of any new project explicitly validating the user problem with data before writing code. In my next project, I spent a week doing user interviews before touching the codebase, and we caught a major assumption error early — which probably saved us two months of work.",
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
    starExample: "The biggest professional failure I've had was leading a platform rewrite that never shipped. About two years ago, I led an effort to replace our legacy PHP monolith with a new Go-based microservices architecture. We worked on it for nine months with a team of five. We never shipped it. A product emergency pulled the team away, the business direction shifted, and by the time we came back, the codebase had diverged so much from the monolith that integration would have taken another six months. We killed the project. What I got wrong was underestimating how much organizational alignment a rewrite requires compared to a feature build. I had the engineering buy-in but not the business buy-in — nobody with P&L responsibility had explicitly committed to protecting our timeline. I also didn't set milestone-based kill criteria upfront, so we kept going well past the point where the ROI was clearly negative. Since then I've become much more pragmatic about rewrites. I insist on explicit executive sponsorship before week one, and I frame large migrations as strangler-pattern incremental work rather than big-bang replacements. Hard lesson, but it fundamentally changed how I approach large-scale initiatives.",
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
    starExample: "About a year ago, my team needed to add search functionality to our product, and I had to choose between PostgreSQL full-text search or integrating Elasticsearch. My task was to make the recommendation and own the build. I evaluated four criteria: query complexity we'd need in the next 12 months, operational burden for a three-person backend team, time to ship, and cost. PostgreSQL full-text search covered 80 percent of our planned query types, had zero new operational overhead since we already ran Postgres, and would take two weeks to implement. Elasticsearch covered 100 percent of query types but would take six weeks including infra setup, add a new system for on-call, and cost about 400 dollars a month. Given that most of our search queries were simple keyword lookups and we were a small team, I recommended starting with Postgres. We shipped in two weeks. Eighteen months later we're still using it — we never needed the advanced full-text features Elasticsearch would have provided. That decision saved us roughly eight weeks of engineering time.",
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
    starExample: "About 18 months ago, our main product API had an endpoint consistently hitting 2.5 seconds response time, and users were flagging it in support tickets. My task was to get it under 500 milliseconds. I started with instrumentation — I added distributed tracing with Jaeger and profiled 100 real requests. The trace data showed 1.8 seconds was spent in a single SQL query doing a full table scan on a 20-million-row table because of a missing composite index. There was a second bottleneck: we were making 12 sequential downstream API calls to our user service for what could be one batched call. I added the composite index, which brought that SQL piece from 1.8 seconds to 80 milliseconds. Then I refactored the downstream calls into a single batch endpoint, cutting another 900 milliseconds. Total response time dropped from 2.5 seconds to 230 milliseconds — a 90 percent improvement. Support tickets about slowness disappeared within a week. One trade-off was the batched endpoint required a small schema change on the user service side, which needed coordination with that team.",
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
    starExample: "About eight months ago, I made the case to our VP of Engineering to dedicate an entire sprint — two weeks — to paying down technical debt in our notification service, which had accumulated over three years of fast feature work. I quantified the cost of the debt in three ways: the notification service had the highest on-call incident rate of any service, averaging 2.3 incidents per month costing roughly six engineer-hours each; every new feature in that area took 40 percent longer than equivalent features elsewhere due to complexity; and there was a known race condition that had caused data loss for 12 users over the past six months. I put these numbers into a one-page brief: the debt was costing us roughly 60 engineer-hours per quarter in incidents alone, plus the feature slowdown. The VP approved the debt sprint immediately. We refactored the fanout logic, eliminated the race condition, and simplified the retry mechanism. The following quarter, incident rate dropped from 2.3 to 0.4 per month, and feature cycle time in that area improved by 35 percent.",
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
    starExample: "About a year ago, I introduced Datadog APM to our backend team, replacing our ad-hoc logging approach for performance monitoring. Before that, debugging production slowness meant grepping through logs and guessing. My task was to get the tool adopted across three backend services. I started by running a proof-of-concept on our most painful service — I set it up in a week, then used it to diagnose a real production issue that had been open for two months. The investigation that used to take three days took 45 minutes with the distributed trace. I demoed this at our weekly engineering review and immediately had buy-in. Then I wrote a five-minute setup guide specific to our stack and did live walkthroughs with each team in their own codebase. One engineer was skeptical about cost — Datadog is expensive — so I pulled together a rough calculation of engineering hours saved versus the monthly bill. The tool paid for itself within the first month. We had it running across all three services within six weeks, and it's now part of our standard service template.",
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
    starExample: "The project I'm most proud of is a data pipeline I built that reduced our ML model training time from 18 hours to 40 minutes. This was at a startup where I was the only data engineer. The model team was blocked on fast iteration because training was so slow. My task was to redesign the pipeline from scratch. I identified that the bottleneck was reading raw JSON files sequentially from S3, so I built a Spark-based batch job that preprocessed data into Parquet format, partitioned by date, and cached it in a dedicated S3 prefix. I also parallelized feature computation across a 20-node EMR cluster. The result was a 27x speedup in training time. Within two months of shipping this, the ML team went from running one experiment per week to running four per day. They shipped two new model versions in the quarter after my pipeline went live, compared to zero the quarter before. That project taught me that sometimes the most impactful engineering work is enabling other teams to move faster, not building user-facing features directly.",
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
    starExample: "The most technically challenging project I've worked on was building a real-time bidding engine for a digital advertising platform. The requirement was to handle 500,000 bid requests per second with a hard 100-millisecond response time budget, including network round trips. I was one of two engineers on the project. The core challenge was enforcing per-advertiser daily budget caps in real time without a centralized write bottleneck. I designed a distributed counter system where each node maintained a local budget estimate and synced to Redis every 200 milliseconds, with a conservative margin to prevent overspend. For the matching logic, I pre-computed targeting criteria into bloom filters to enable sub-millisecond lookups. Getting p99 latency below 100 milliseconds took about four weeks of profiling — including replacing JSON serialization with Protocol Buffers, which alone saved 12 milliseconds per request. In production we hit p50 at 28ms and p99 at 82ms. The system handled Black Friday traffic — about 1.2 million requests per second at peak — without degradation.",
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
    starExample: "About two years ago, we had a hard deadline to ship a GDPR data deletion feature before a compliance audit — four weeks for what was originally scoped as an eight-week project. I was the tech lead. The scope included user data deletion across seven services and a data warehouse. I started by triaging with the PM: which parts were legally required and which were enhancements? We cut three of the seven services — the ones with lower data sensitivity — to be addressed post-audit in a tracked follow-up. For the remaining four, I parallelized the work across the team and set up a daily five-minute check-in to surface blockers fast. The trickiest piece was the data warehouse deletion — our BigQuery tables didn't support row-level deletes easily, so I implemented a partition-based deletion workaround that processed requests within 48 hours instead of real-time. We shipped the legally required scope on time, the audit went cleanly, and the deferred items were completed two sprints later. It wasn't perfect, but it was defensible and legally compliant — which was what mattered.",
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
    starExample: "About 18 months ago, I led the rebuild of our user onboarding flow. Before, about 62 percent of new users dropped off before completing setup. My task was to improve first-week activation by at least 15 percentage points — meaning a user completed their first key action within 7 days of signup. I worked with the designer to rethink the flow: we cut onboarding steps from nine to four, added inline tooltips for the two most confusing steps based on session recording data, and introduced a progress bar. I also A/B tested the step order for two different user segments. I instrumented every step with Amplitude events so we had a full funnel view from day one. After two weeks in production, activation rate improved from 38 percent to 57 percent — a 19-point improvement, exceeding the target. Retention at 30 days also improved by 8 percent, which we hadn't expected. The data surprised me in one way: the progress bar had the single largest individual impact — removing anxiety about 'how much is left' was worth a 7-point lift on its own.",
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
    starExample: "About a year and a half ago, I was put on a project that required Kubernetes expertise — which I had essentially zero experience with. We needed to containerize and orchestrate seven backend services in four weeks before a major deployment. I treated the first three days like a focused bootcamp: I went through the official Kubernetes docs and deployed a personal project on a minikube cluster just to get hands-on. Then I identified the five concepts I actually needed for the project — Deployments, Services, ConfigMaps, Ingress, and persistent volumes — and only went deep on those. I also found a colleague who'd done this before and asked for a 30-minute brain dump session. By day five, I had our first service containerized and deploying cleanly. By week three, all seven services were live. By week four, I'd written a Kubernetes setup guide specific to our stack for the rest of the team. It took about three weeks to feel genuinely confident, but I've used it on every project since — it's now our default deployment target.",
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
    starExample: "About a year ago, I voluntarily asked for a mid-cycle feedback session from my manager, six months before the normal performance review. I was six months into a new role and wasn't getting much signal on how I was perceived — I felt productive, but I wanted to know where I stood. I requested a dedicated 30-minute session and came in with three specific questions: what was I doing well, where was I falling short of expectations, and what would 'great' look like versus my current 'good' performance. The feedback was more candid than I expected. My manager said I was strong technically but sometimes communicated disagreements in a way that felt abrupt in group settings. That was genuinely useful. I asked for a specific example and got one. I started practicing pausing before pushing back in meetings and framing disagreements with 'I want to make sure I understand your thinking first.' Within three months, my manager mentioned unprompted that my collaborative communication had noticeably improved. Seeking that feedback early probably compressed six months of guessing into a week of clarity.",
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
    starExample: "About two years ago, our startup was acquired and within the first month, the acquiring company announced they were migrating all our infrastructure to their internal platform — a proprietary system I'd never heard of. They gave us 10 weeks to complete the migration. For me personally, it meant learning an entirely new deployment model mid-project. My task was to lead the backend migration for five services while keeping them running. I spent the first week understanding the new system by setting up a non-critical service as a pilot. I documented every difference from our old setup in a shared doc so my team didn't have to re-learn things I'd already figured out. I also established a direct channel with one of the acquiring company's platform engineers as a single point of contact, so we could get unblocked quickly rather than filing tickets. Most of the team was frustrated by the disruption. I tried to frame it as: we're learning a more mature platform, and our services will be more reliable on the other side. We completed the migration on week 11 — one week late — but with zero user-facing disruption.",
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
    starExample: "I stay current in a few ways, but the most effective is spending about two hours every Saturday on targeted reading. I follow a curated list of engineering blogs — Stripe, Netflix, Uber — and the ACM Queue journal. A recent example: about three months ago I read the Stripe engineering post on how they handle idempotency keys in distributed payment systems. It was directly relevant to a feature I was building at the time. I designed our own idempotency layer using the same conceptual approach — a Redis-backed key store with TTL-based expiration — and it's held up well under load. I also attend one conference per year; I went to QCon last fall, where I find the hallway conversations more valuable than the talks themselves. Last quarter I introduced structured logging with trace IDs to our team after a talk on observability, which meaningfully improved our on-call incident resolution time. My main filter for noise: I'm skeptical of anything heavily marketed. I wait to see if thoughtful engineers I respect are actually using it in production before investing time in it.",
  },
]
