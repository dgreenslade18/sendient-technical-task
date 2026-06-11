# AI Notes

This file is required. We use it to understand how you collaborated with AI tools. **Please be specific** — generic statements like "I used Claude to write some code" don't tell us anything.

Aim for ~10 minutes on this. Quality over length.

---

## 1. Tools you used

Which AI tools did you reach for, and for what kinds of work? (e.g., Claude Code / Cursor / ChatGPT / Copilot, used for architecture sketching / code generation / test scaffolding / refactor proposals / domain research, etc.)

Cursor - Opus 4.8 - used for sanity checking ideas, initial audit scan (audit only, no code change), review options for audit fixes and code changes. 
Created mermaid diagram for how repo works and generally vibe coding. 
ChatGPT - used to rewrite some of my content and text. I also used ChatGPT to sanity check the UI. I grabbed a screenshot, and gave it the scenario of being a teacher for the insights dashboard, to essentially sanity check what the expected output would look like for it to be as usable as it could be. 

---

## 2. Where AI took you further than you could have gone alone 

This is the part we care most about. Pick **one or two specific things** in your submission that you would not have delivered (or would not have delivered at this quality) in the time available without AI.

For each one:

- **What it is** (point at file/line if possible).
- **Where AI helped** — the prompt or interaction shape, the suggestion, the option-generation, whatever it was.
- **What you did to verify it** — read it carefully, ran tests, sanity-checked the edge case, rejected one of the options it gave, etc.

# Audit and priority list of each issue 
- **What it is - Priority list in AUDIT.md, fixes in server.actions**
- **Where AI Helped** 
I used Opus to run me a full audit of the codebase and work with me to determine the impact of each issue that it identified. Rather than asking it to make any changes immediately, I treated this as a find and research task so that I could work out what I wanted to get done in the time frame vs what I'd have to defer. 
- **Verification** 
Each suggestion was manually verified against the codebase and combined with similar issues where possible. I also got Opus to verify the things I had found during my own review. In serveral cases, I opted not to implement the suggestions due to time constraints or really low impact issues. AI increased the speed of the discovery process, but the prioritisation and the actual fix decisions were mine. 

# Cohort insights feature 
- **What it is - /insights/page.tsx**
- **Where AI helped** 
I had Opus first create me a full mermaid md and diagram to better understand the codebase and repo and how it was structured. I wrote up notes for the goal of the feature, and got Opus to explore 3 different ways of presenting the cohort insights. I took it a little step further and got it to understand whether the information it would display would be useful to its end user (a teacher). I then also used Opus to generate the initial implementation for the calculations of the analytics. 
- **Verification**
I reviewed the generated code, validated and sanity checked the calculations against the seeded data (originally I questioned whether the figures were right), then ran the test suite. I also conducted a separate AI review to sanity check the outputs. Opus wanted to change the seeded data so that we could see more calculations on the front end, as well as its suggestions for more complex visualiations. I was concerned about the time we had remaining on this challenge to get us there, and decided instead to keep the feature focussed on the small and clear insights that a teacher could digest easily and quickly. I didn't want this to become a mini Power BI dashboard. 
Once I was satisfied with the Insights page, I asked Opus the question 'The aim is to surface **something an actual teacher would find useful**, not just a render of an array. Think about empty states, small-sample edge cases, and what would mislead a teacher if you got it wrong. - do you think my solutions suffices this scope, and if not, what corrections, changes and additions are you recommending'. After challenging this, it identified a teacher facing trust issue, students without any records were invisible. I verified the concern and updated the feature to show coverage and consistent rules.


---

## 3. Where AI was wrong, shallow, or unhelpful

What did AI get wrong, miss, or oversimplify? What did you have to correct? Where did you decide to *not* take its suggestion?

AI consistently attempted to optimise for completeness rather than the timebox. We got to a point where broad refactors, additional analytics and more complex visuals like graphs were being recommended, whereas the time I had remaining on the task and the scope of the project were being pushed beyond. Opus recommended we expand and enhance the seeded data to expand the insights page even further, recommending charts and graphs etc. Rather than that, I repositioned it to focus on things being clear for the end user and clear insights for teachers instead. Although it was great for generating options and ideas, I actually found the most valuable decisions were about what not to build and when to pull it back on track for the scope. 

---

## 4. If you had another hour, what would you have done with it?

Specifically — what would AI have helped you do in that hour that you didn't get to?

I would get it to do a few of the original priority audit items, such as splitting everything out into separate files rather than one large file. I'd then also iterate over the insights page and strengthen the teacher facing aspects of that page. I would get Opus to explore additional edge cases and look at whether any of the analytics could be misleading in certain scenarios (potentially some sort of trend based insights). I could have also gotten AI to then expand test coverage to account for those scenarios and increase confidence in the analytics. 
