# AI Notes

This file is required. We use it to understand how you collaborated with AI tools. **Please be specific** — generic statements like "I used Claude to write some code" don't tell us anything.

Aim for ~10 minutes on this. Quality over length.

---

## 1. Tools you used

Which AI tools did you reach for, and for what kinds of work? (e.g., Claude Code / Cursor / ChatGPT / Copilot, used for architecture sketching / code generation / test scaffolding / refactor proposals / domain research, etc.)

Cursor - Opus 4.8 - used for sanity checking ideas, initial audit scan (audit only, no code change), review options for audit fixes and code changes. 
Created mermaid diagram for how repo works
ChatGPT - used to rewrite some of my content and text

---

## 2. Where AI took you further than you could have gone alone 

This is the part we care most about. Pick **one or two specific things** in your submission that you would not have delivered (or would not have delivered at this quality) in the time available without AI.

For each one:

- **What it is** (point at file/line if possible).
- **Where AI helped** — the prompt or interaction shape, the suggestion, the option-generation, whatever it was.
- **What you did to verify it** — read it carefully, ran tests, sanity-checked the edge case, rejected one of the options it gave, etc.

# Audit and priority list of each issue 
I used Opus to run me a full audit of the codebase and work with me to determine the impact of each issue that it identified. Rather than asking it to make any changes immediately, I treated this as a find and research task so that i could work out what I wanted to get done in the time frame vs what I'd have to defer. 
Each suggestion was manually verified against the codebase and combined with similar issues where possible. I also got Opus to verify the things I had found during my own review. in serveral cases, I opted not to implement the suggestions due to time constraints or really low impact issues. AI increased the speed of the discovery process, but the prioritisation and the actual fix decisions were mine. 

# Cohort insights feature 
I had Opus first create me a full mermaid md and diagram to better understand the codebase and repo and how it was structured. I wrote up notes for the goal of the feature, and got Opus to explore 3 different ways of presenting the cohort insights. I took it a little step further and got it to understand whether the information it would dispaly would be useful to its end user (a teacher). I then also used Opus to generate the intial implementation for the calculations of the analytics. 
I reviewed the generated code, validated and sanity checked the calculations against the seeded data (originally i questioned whether the figures were right), then ran the test suite. I then conducted a spearate review to sanity check the outputs. Opus wanted to change the seeded data so that we could see more calculations on the front end, as well as its advances for more cplex visualiations. I was concerned about the time we had remaining on this challenge to get us there, and decided instead to keep the feature focussed on the small and clear insights that a teacher could digest easily and quickly. I didnt want this to become a mini Power BI dashboard. 

---

## 3. Where AI was wrong, shallow, or unhelpful

What did AI get wrong, miss, or oversimplify? What did you have to correct? Where did you decide to *not* take its suggestion?

> _Your answer here._

---

## 4. If you had another hour, what would you have done with it?

Specifically — what would AI have helped you do in that hour that you didn't get to?

> _Your answer here._
