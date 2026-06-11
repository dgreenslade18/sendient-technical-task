# Audit Notes 
# (Start time 19:20 11/06)
# (End 20:15 11/06)

_Fill this in as you go. See the README for what we're looking for._

## What I found

_(List the issues you noticed in the starter codebase. Bullet points are fine.)_

1 - No validation on scoring system and recordProgress!
2 - deleteStudent is a hard delete - losing all of the user data and progress records - needs soft delete! 
3 - Internal admin helpers in server.actions can be used unauthenticated as its called by use server - exposed endpoints! 
4 - Deleted students show in lists and averages as soft delete isnt filtered!
5 - NaN possible for getAverage for student if you divide by 0
6 - ScoreBadge issues - should be using classifyScore (which in itself is unused and could be removed if not being used) and has no upper band validation

7 - Index is stored per second and not per day - recordedAt has second granulatrity 

8 - '- **TypeScript strict, no `any`.** Use `unknown` and narrow.' - and yet recordProgress accepts 'any'. Ties in with point 1. 
9 - No env or env.local set up - db paths are hardcoded - could create and use env
10 - server actions contains EVERYTHING - students topics, progress and admin. Readme states large files hurt cold-start up times. Should split out

11 - No ESLint config for next lint - no linting available

12 - 'text-blue-600' exists even though readme states to use semantic tokens
13 - async actions but get, all, run are all synchronous  - could be a single sql. 
14 - dark mode exists but never used
15 - low accessibility score


## What I fixed and why

_(For each fix: where it was, what was wrong, and why this one was worth fixing first.)_

These fixes were all in server.actions - all issues were at the server action/data level.
1 - Replacing recordProgress-any with a Zod schema. This now means out of range scores cannot be written to the database now and averages cant be corrupted by NaNs etc - also fixes 8.
2 - Introduced a soft delete for detele student - keeps the row but adds a 'deletedAt' - audit trail, schema and progress preserved.
3 - Removed _unsafeDeleteAllProgress server action - Was originally a exported 'use server' module, therefore, public endpoint which could have wiped the progress_records table. Was also redundant. Pretty hazardous to leave it in
4 - Added an isNull filter to getStudents, getStudent, getTopics and getAverageForStudent and getProgressforStudent - means any soft deleted students and topics no longer appear in lists or count towards averages.

5 - AverageScoreWidget.tsx - when there are no records, total/rows.length would be NaN. getAverageForStudent returns number|null so returns null when there are no records. AverageScoreWidget also has a empty awiting state now too 
6 - ScoreBadge now uses classifyScore helper instead of duplicating the 70/50 thresholds and then uses the correct semantic tokens. Only 1 source of truth now, so cant drift between the 2 and corrects the badge theming. 


## What I deferred and why

_(Anything you spotted but chose not to fix — and what would push it up the priority list.)_

Realistically and simply, I deferred anything which was not a major risk to the end user or security of the project. 

Things like styling (cosmetics), linting, setting up a .env file (dev only) or anything config was deferred. 
They can be resolved, and some of them quite quickly, but with the time constraints, its more important to fix things which could result in  invalid assessment and progress data to leak through, anything that affects the UI or UX or anything which would lose data.

I also deferred anything which felt out of scope, for instance hooking up dark mode.  

Items I deferred: 

7 - This would need a new migration, along with a day-truncation strategy. This could become a priority though if same day entries started to appear.
10 - File size is 139 lines, although it contains everything and be cleaner to split it out, it doesnt quite require a huge refactor yet, but again, once this file starts to increase in size, this becomes an easy priority.  
11 - This would be the one I'd pick to do as its a failry easy fix (just given time constraints one to push down to 'maybe') - having linting in would have stopped the 'any' issue appearing. 
12 - Token change - correct for the readme, but makes no difference to the usability
13 - If we were to migrate to a async driver, i'd pull this forward as a priority. 
14 - Exists but never used - feature rather than a bug to fix - a 'nice to have'
15 - would pull this forward as something to sort app wide if in scope.


## What I'd argue is the biggest problem with the codebase

_(One paragraph. Pick the one that matters most.)_

single biggest issue in this codebase is surrounding the lack of data integrity protection. The readme states that soft-deletes should be used and each table already has a 'deletedAt' included as a column, and yet the deleteStudent was a hard delete and removed rows, without then filtering out those deleted rows, so they were actively impacting the scoring system. This then has an impact on the trust of data and statistics being displayed on the front end, and the lose of tracability for the progress that is lost with the delete. We also have the issue that we could remove an entire table with an exposed endpoint which is a larger data integrity and security risk - exactly why i prioritised data integrity and validation related fixes first. 