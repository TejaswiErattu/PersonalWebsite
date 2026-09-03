# Redesign the Pixel Portfolio Village

Work from the root of the existing `pixel-portfolio` repository.

## Project context

This is an existing React 19, TypeScript, Vite, Kaplay pixel portfolio. Do not rebuild it from scratch or replace its architecture.

The project currently includes:

* A Kaplay village at `/play`
* A 48 by 23 ASCII map in `src/game/village.ts`
* Procedurally generated pixel buildings in `src/game/worldSprites.ts`
* A procedurally generated four-direction player sprite in `src/game/sprites.ts`
* Wandering chickens and flowers in `src/game/scenery.ts`
* Location and station definitions in `src/game/locations.ts`
* A React overlay in `src/components/DialogueBox.tsx`
* Shared portfolio content in `src/content/content.ts`
* Accessible classic pages and prerendered project routes
* Existing project videos for Findar, Bump, TerraLend, and Unearthed Dinos

Preserve the working movement, collision, camera, audio, touch controls, classic view, prerendering, SEO, routes, and accessible fallback.

Do not add a new game engine or replace Kaplay.

## Main goal

Transform the current generic village into a portfolio map with:

* Eight themed buildings
* One interactive growth farm
* Nine clearly identifiable locations total
* One signpost for every location
* Clearly differentiated windows or stations
* Large scrollable overlays instead of paged dialogue
* A feminine pink player character
* Small interactive world animations
* One simplified navigation bar

The visitor should be able to understand what every location represents before entering it.

## Final village layout

Enlarge and restructure the ASCII map into a clean 3 by 3 arrangement with generous paths between locations.

Suggested layout:

| Row    | Left                        | Center                        | Right                          |
| ------ | --------------------------- | ----------------------------- | ------------------------------ |
| Top    | About Me Cottage            | Current Roles Train Station   | Engineering Workshop           |
| Middle | AI and Teaching Schoolhouse | Mobile Innovation Observatory | Developer Tools Cyber Workshop |
| Bottom | Community Impact Greenhouse | Growth Farm                   | Contact Post Office            |

The player should spawn near the central path with every district reachable. When the character approaches the front of a house, smoothly zoom the camera in slightly to highlight that house. When the character walks away from the house and explores the village, smoothly return to the normal full-map view.

Update the map legend, collision data, building symbols, scenery placement, interaction registration, and world dimensions together.

## Location 1: About Me Flower Cottage

### Visual design

Create a warm, normal pixel cottage with:

* Flower boxes
* Extra flowers around the walls, with vines climbing the exterior
* A small front garden
* Warm brown and cream colors
* A roof or facade sign reading `ABOUT ME`

### Windows

Create three visibly different windows:

1. **Introduction**
2. **UW and Education**
3. **What I’m Looking For**

Distinguish them using different flower colors, small pixel icons, colored window trim, and individual plaques.

### Content

Do not include a technical skills list.

Use a concise introduction similar to:

> Hi, I’m Tejaswi Erattu Taj, an Informatics student at the University of Washington focusing on software engineering and cybersecurity. I enjoy building useful tools, improving complicated systems, and making technology safer for the people relying on it. This village is a playful version of my portfolio, with each location representing a different part of my journey.

Include:

* University of Washington
* BS in Informatics
* Focus on Software Engineering and Cyber Security
* Expected graduation in 2028
* GPA of 3.8/4.0
* Seattle, Washington
* A short explanation of the gamified portfolio concept

Use the newest resume information when old portfolio copy conflicts with the resume.

## Location 2: Current Roles Train Station

### Visual design

Replace the generic current-roles building with a pixel train station representing career progress.

Include:

* A station roof and clock
* A horizontal railway track
* A small platform
* Luggage, signs, or benches
* A facade sign reading `CURRENT ROLES`
* A separate plaque for each platform window

### Windows and platforms

1. **Palana**

   * Security Engineer
   * June 2026 to Present

2. **Accountability & Hopeful Fridays**

   * Software Engineering Lead
   * May 2026 to Present

3. **Women in Informatics**

   * Finance Director
   * Current position

Reuse the factual Palana and Accountability & Hopeful Fridays resume bullets already available in `content.ts` and the resume files. Do not weaken or rewrite away the measurable details.

For Women in Informatics, include only factual information:

* Serves as Finance Director
* Helps manage organizational budgets and financial tracking
* Supports sponsorship and invoice coordination
* Helps prepare funding and grant materials
* Tracks finances for events and initiatives

Do not invent monetary totals or unsupported impact metrics.

### Train interaction

Add a contextual side button labeled `Incoming Train` when the player is near the station.

When activated:

1. A small pixel train enters from one edge of the track.
2. It slows as it reaches the station.
3. It pauses for approximately three seconds.
4. It continues off the opposite side of the map.
5. The temporary train objects are removed afterward.

Requirements:

* Disable the button while the train animation is active.
* Add a roughly 10-second cooldown before another train can be called.
* Prevent several trains from stacking.
* Under `prefers-reduced-motion`, show the train already stopped at the station briefly instead of animating it across the screen.
* The train is decorative and must not block the player.

## Location 3: Engineering Workshop

### Visual design

Create a workshop with:

* Gears
* Tools
* A workbench
* Small code screens
* Pipes or mechanical decorations
* A facade sign reading `ENGINEERING EXPERIENCE`

### Windows

1. **Kerala Association of Washington**
2. **iLink Digital**
3. **GoEzz**

Each window should open the complete role information in one scrollable overlay.

The Kerala Association window should also include access to the existing full Kerala membership platform project write-up and recognition image.

Use resume content as the factual source. Expand formatting and organization, but do not invent technologies, numbers, or responsibilities.

## Location 4: AI and Teaching Schoolhouse

### Visual design

Create a schoolhouse combined with a small AI laboratory.

Include:

* A school bell
* Books
* A small robot or computer symbol
* A chalkboard-style sign
* Subtle dojo details for the martial arts role
* A facade sign reading `AI & TEACHING`

### Windows

1. **Apollo AI**
2. **Cyber Minds**
3. **iCode**
4. **Martial Arts Leadership**

The Cyber Minds window should include both:

* The Machine Learning Manager role
* Access to the complete Cyber Minds chatbot project information

Use the existing factual information from `content.ts` and the resumes. Keep the metrics already supported by the resumes.

## Location 5: Mobile Innovation Observatory

### Visual design

Create an observatory or mapmaker’s tower with:

* A telescope
* Location pins
* A small phone symbol
* Stars or directional markers
* Blue and purple details
* A facade sign reading `MOBILE INNOVATION`

### Windows

1. **Findar**
2. **Bump**

Each window opens that project’s complete existing long-form content, including:

* Introduction
* Demo video
* Problem statement
* How it works
* Features
* Architecture
* Technology stack
* Impact
* Lessons
* Limitations
* Future plans
* GitHub and live links where available

Do not split the content across repeated Space presses.

## Location 6: Developer Tools Cyber Workshop

### Visual design

Create a secure developer workshop with:

* Locks
* Git branches
* Terminals
* Gears
* Warning symbols
* Dark purple, charcoal, and pink accents
* A facade sign reading `DEVELOPER TOOLS`

### Windows

1. **GitHub Extension**
2. **Summer Schedule**

The GitHub Extension content should use the current resume and `content.ts` information.

Inspect the following project folder for the Summer Schedule project:

`'/Users/tejaswierattutaj/Library/Mobile Documents/com~apple~CloudDocs/Documents/Tejaswi/Personal/summer life website'`

Determine the project’s real name, purpose, technologies, features, and links directly from its source code and documentation.

If its real displayed name is `Summer Life`, preserve that name and use `Summer Schedule` as a descriptive subtitle. Do not guess.

Do not copy its `.git`, `node_modules`, build folders, environment files, credentials, or unrelated files into the portfolio.

The project owner will provide the final project description and demo video later. Until then:

* Create a factual summary using only the inspected code.
* Add an obvious content-level TODO for the future final description.
* Do not render a broken video element.
* Make the media field optional.
* The project must work correctly before and after a video is added.

## Location 7: Community Impact Greenhouse

### Visual design

Create a small light-blue greenhouse-style house with:

* Many trees surrounding it
* Flowers and planting beds
* Glass or light-blue windows
* Climate instruments
* Small archaeology details
* Community decorations
* A facade sign reading `COMMUNITY IMPACT`

Do not make it excessively large. It should feel like a small house tucked between trees.

### Windows

1. **TerraLend**
2. **Unearthed Dinos**
3. **WINFO Website**

TerraLend and Unearthed Dinos should keep their existing full project information and demo videos.

For the WINFO Website:

* Tejaswi created the website from scratch.
* Use this live link:
  `https://winfo-website-version1-nukxw8nb9-tejaswi-erattus-projects.vercel.app/`
* Inspect the source code at:

`'/Users/tejaswierattutaj/Library/Mobile Documents/com~apple~CloudDocs/Documents/Tejaswi/Personal/WINFO /winfoWebsite/WINFOwebsiteVersion1'`

Use the code to determine the factual stack, pages, functionality, responsive behavior, and design work.

Do not invent usage metrics or organizational outcomes.

The owner will provide a final description and video later. Until then, make the project entry complete enough to display without a video and keep the media field optional.

### Plant More interaction

Add a contextual side button labeled `Plant More` when the player is near the greenhouse.

When clicked:

* Add one small flower or flower cluster to a predetermined empty planting tile near the greenhouse.
* Use the existing flower sprite variants.
* Do not place flowers on buildings, paths, water, trees, interaction points, or the player.
* Use a fixed list of valid planting positions instead of unrestricted random coordinates.
* Add at most one cluster every two seconds.
* Cap newly planted flowers at 12 per session.
* Disable the button during its cooldown.
* Once the cap is reached, display `The garden is full!`
* Do not persist flowers between browser sessions.
* Avoid unbounded object creation or memory leaks.

This is client-side interaction throttling, not a server feature.

## Location 8: Contact Post Office

### Visual design

Turn the existing mailbox concept into a small post office.

Include:

* A chimney
* A mailbox
* Envelope decorations
* A postal sign
* A facade sign reading `CONTACT`

### Windows

1. **Email**
2. **LinkedIn**
3. **GitHub**

Include:

* `tjerattu@gmail.com`
* LinkedIn
* GitHub
* Seattle, Washington
* A clear `Email Me` button

Do not place a phone number prominently unless it is already intentionally present in the current public portfolio.

### Mail animation

Add a contextual side button labeled `Send Mail` when the player is near the post office.

When clicked:

* Five to eight small pixel envelopes fly out of the chimney.
* Give the envelopes slightly different curved paths.
* Fade them out and remove them when the animation ends.
* Add a three-second cooldown.
* Do not allow repeated clicks to create unlimited envelopes.
* Under reduced motion, show a brief envelope sparkle or static envelope cluster instead of flying objects.
* This animation must not send an actual email.

## Location 9: Growth Farm

This should be a farm area, not a house.

### Visual design

Include:

* Three planting plots
* A chicken feeding area
* A small suggestion mailbox or wooden notice board
* Crops, fencing, feed, and gardening tools
* A main sign reading `WHAT I’M GROWING NEXT`

### Growth plots

1. **Hackathons**

   * Tejaswi enjoys attending hackathons.
   * She plans to attend more later in the year.
   * Present this as a place to experiment, collaborate, and build quickly.

2. **Home Lab**

   * She plans to build her own home lab later this year.
   * Present this as a way to practice networking, security, cloud infrastructure, and system administration.

3. **GitHub Extension**

   * She plans to continue developing the GitHub Extension.
   * Mention improving its safety checks, Git workflows, and usefulness for student teams.

Do not invent specific hackathon names, dates, hardware purchases, or unfinished features.

### Visitor suggestion box

Add a textarea where visitors can suggest another project, skill, experiment, or goal.

Requirements:

* Maximum 1,000 characters
* A `Send Suggestion` button
* No database or external form service
* On submit, open the visitor’s email client with:

  * Recipient: `tjerattu@gmail.com`
  * Subject: `Portfolio Growth Idea`
  * Body: the visitor’s suggestion

Use `encodeURIComponent` or equivalent safe URL encoding.

Do not send anything automatically. The visitor must finish and send the email in their own email client.

### Chicken feeding interaction

Add a contextual side button labeled `Drop Feed` when the player is near the farm.

When activated:

1. Display a small feed pile in the farm feeding area.
2. All existing chickens change from wandering mode to feed-seeking mode.
3. They run toward the farm.
4. They gather around the feed without occupying the exact same position.
5. They peck for several seconds.
6. They return to normal wandering behavior.

Implementation requirements:

* Extend the existing scenery system instead of creating a second chicken system.
* Expose a method such as `feedChickens()` through `Scenery`, `GameHandle`, and `GameCanvas`.
* Use lightweight grid-based pathfinding or safe walkable waypoints so chickens do not become stuck behind buildings.
* Give every chicken a slightly different target around the feed pile.
* Disable the button while feeding is active.
* Add an eight-second cooldown after feeding.
* Do not spawn additional chickens.
* Remove the feed pile when feeding ends.
* Under reduced motion, show the feed and a static pecking state without a fast running animation.

## Signposts and window identification

Replace the current mostly directional signposts with one themed informational signpost for each of the nine locations.

### What is visible in the world

Each signpost should visibly show only the location heading, such as:

* About Me
* Current Roles
* Engineering Experience
* AI & Teaching
* Mobile Innovation
* Developer Tools
* Community Impact
* Contact
* What I’m Growing Next

The signpost’s background, border, icon, and colors should match its location.

### What happens when a signpost is opened

When the player approaches a signpost and presses `E`, open the same large overlay system used by buildings.

The signpost overlay should include:

* The location heading
* A one-sentence description
* A list of everything available there
* A window or station legend
* The name and icon/color of every window
* A brief explanation of what each window contains

Example:

**Current Roles**

See the roles I hold today and the work I am currently helping lead.

* Blue shield window: Palana
* Gold planning window: Accountability & Hopeful Fridays
* Purple finance window: Women in Informatics

### Distinguishing physical windows

Every interactive window must have:

* A unique colored frame or awning
* A small pixel icon
* A short plaque under or beside it
* A matching label in the location’s signpost
* A prompt that names the exact window when the player is nearby

Align every station trigger directly with its visible window.

Increase the minimum station spacing from the current 16 pixels to at least 24 pixels, or another tested distance that allows the 16-pixel player to target each window reliably.

Widen buildings when necessary. Do not squeeze four window interactions into a facade that cannot support them.

## Replace the paged dialogue system

The existing `DialogueBox.tsx` uses:

* Typewriter text
* Line phases
* Detail block phases
* Cards
* Space or click to advance
* One block at a time

Replace that behavior.

### New overlay behavior

Pressing `E` at a window, door, plot, or signpost should open one large scrollable overlay.

Requirements:

* Cover most of the viewport, approximately 90 to 94 percent of the width and 86 to 92 percent of the height.
* Keep part of the village visible through a darkened or lightly blurred backdrop.
* Render the title and all related content at once.
* Let visitors scroll normally.
* Do not require repeated Space, Enter, `E`, or mouse clicks.
* Do not close when someone clicks inside the content.
* Close only through the visible close button, `Escape`, or an intentional backdrop click.
* Lock body scrolling while open.
* Preserve the current focus trap and restore focus to the opening control.
* Include a sticky overlay header with the title and close button.
* Support keyboard, mouse, and touch devices.
* Use readable body text of at least 16 pixels.
* Keep project links, technology chips, images, and cross-links functional.

Reuse `DetailBlockView` to render all project blocks in order rather than showing one block at a time.

Remove the typewriter timing, phase counter, `Space next`, and click-to-advance behavior.

## Video behavior

When a project overlay containing a video opens, the video must use:

```html
<video autoplay muted playsinline loop controls preload="metadata">
```

Requirements:

* Start automatically when the overlay opens.
* Start muted because browsers block most autoplay with sound.
* Display an obvious mute/unmute control through the standard video controls.
* Replay from the beginning whenever it ends by using `loop`.
* Pause when the overlay closes.
* Reset `currentTime` to `0` when the overlay closes.
* Do not load all project videos when the village first opens.
* Continue using poster images.
* Do not show a broken player for Summer Schedule or WINFO before their videos are supplied.

## Player character redesign

Keep the current 16 by 16, four-direction, four-frame procedural sprite architecture.

Change the character to look feminine and pink while preserving movement and animation.

Use:

* Longer dark brown or pink-tinted hair
* A pink shirt, dress, jacket, or or overalls
* Dark pink or burgundy lower clothing
* Pink accessories such as a bow or hair clip
* Matching four-direction details
* Clear walking leg movement
* Good contrast against grass and paths

Do not recolor the entire village pink. Only the character and small related accents should use the stronger pink palette.

## Navigation

There must be only one navigation bar.

The current project can show the global `TopBar` and an additional internal classic navigation. Remove the duplicate internal navigation from `ClassicMode`, `SectionPage`, and `ProjectPage` where it causes two navigation bars to appear.

The global top navigation should contain only:

* About
* Experience
* Projects
* Growth
* Contact

Keep the name/logo, audio control, credits, and village/classic toggle if they fit without overcrowding.

Move resume links into Contact instead of showing both resume links as top-level tabs.

### Content grouping

* `About` includes introduction and education.
* `Experience` includes current roles and past positions.
* `Projects` includes all project groups.
* `Growth` includes the farm plans and suggestion form.
* `Contact` includes email, LinkedIn, GitHub, resumes, and location.

Existing project detail routes must continue working.

If older routes such as `/education`, `/security`, or `/achievements` are removed from the main navigation, preserve their useful content inside the five new sections. Avoid broken inbound links by redirecting or retaining compatibility routes where practical.

## Content architecture

Keep `src/content/content.ts` as the single source of truth.

Do not put portfolio prose directly into:

* `locations.ts`
* React components
* Sprite files
* Game engine files

Create or extend structured content models for:

* Village locations
* Window/station labels
* Signpost descriptions
* Grouped experiences
* Growth plans
* Contextual interaction labels
* Optional project videos
* Optional detailed project content

The game view and classic view must render from the same data.

Use the latest resume information as authoritative when old copy conflicts with it.

Do not invent:

* Technologies
* Job duties
* Dates
* Metrics
* User counts
* Awards
* Project outcomes
* Certifications

## Contextual action controls

Add a small contextual action button on the right side of the game viewport when the player is close to a special location.

Desktop examples:

* Train station: `Incoming Train`
* Greenhouse: `Plant More`
* Farm: `Drop Feed`
* Post office: `Send Mail`

On mobile, display the action above the movement controls without covering the `E` button.

Only show the action associated with the nearby special location.

Every action needs:

* A clear text label
* An accessible name
* Keyboard accessibility
* Touch support
* A visible disabled/cooldown state
* Protection against stacked animations
* Proper cleanup when the component or game unmounts

Do not use external animation libraries unless the current code cannot reasonably support the effect.

## Visual consistency

Preserve the cozy pixel-art style.

Extend the procedural sprite system with building variants for:

* Cottage
* Train station
* Workshop
* Schoolhouse
* Observatory
* Cyber workshop
* Greenhouse
* Post office
* Farm structures

Keep:

* Crisp pixel rendering
* No anti-aliasing
* Seeded decorative placement
* Consistent 16-pixel tile scale
* Existing water, grass, paths, trees, flowers, motes, and chickens
* Legible signs and plaques
* Good contrast

Do not replace the portfolio with generic modern cards floating over the game. The village remains the primary experience.

## Performance and accessibility

Preserve or improve:

* Keyboard movement
* Touch movement
* `E` interaction
* Focus trapping
* Focus restoration
* Semantic classic pages
* Screen-reader descriptions
* Reduced-motion behavior
* Lazy loading of Kaplay
* Video poster images
* Prerendered routes
* Sitemap and metadata
* Mobile responsiveness

Animations must not create unbounded game objects.

All temporary trains, flowers, envelopes, and feed objects must be tracked and cleaned up correctly.

Ensure interaction buttons do not activate while a content overlay is open.

## Production URL

The intended portfolio URL is not changing. The existing portfolio at:

`https://tejaswierattuwebsite.vercel.app/`

must remain completely untouched.

This repository is a separate new portfolio project that should run locally for now. Do not configure it to replace, overwrite, redirect to, or deploy over the existing portfolio.

For local development:

* Do not use the old portfolio URL as this project’s canonical deployment URL.
* Do not change the existing site’s `SITE_ORIGIN`, sitemap, Open Graph metadata, JSON-LD, robots file, routes, or visible website links.
* Do not leave `https://tejaswierattutaj.vercel.app` as a production or canonical domain for this new project.
* Use a local development origin such as `http://localhost:5173/` only where a valid absolute URL is required during local development.
* Keep the site-origin configuration easy to update later when a separate Vercel project and new deployment URL are created.
* If the repository already has a site-origin constant, preserve the old portfolio configuration and create a separate local/new-project configuration rather than modifying the old site.
* Ensure the project runs locally without requiring deployment-specific environment variables or external services.
* Do not make any changes to the existing `tejaswierattuwebsite` portfolio.

## Required implementation sequence

1. Inspect the existing repository and the two supplied project folders.
2. Update the structured content model.
3. Consolidate the navigation and classic sections.
4. Redesign the ASCII map for nine locations.
5. Add the building and farm sprite variants.
6. Add visible signs, windows, plaques, and matching interaction triggers.
7. Replace the paged dialogue system with the full scrollable overlay.
8. Add video autoplay, looping, reset, and cleanup behavior.
9. Add the train, planting, feeding, and mail interactions.
10. Update the player sprite.
11. Update routes, prerendering, sitemap, metadata, and classic pages.
12. Validate desktop, mobile, keyboard, touch, and reduced-motion behavior.
13. Run the complete build and lint checks.
14. Fix all errors before considering the work complete.

## Acceptance checklist

The work is complete only when all of the following are true:

* [ ] The village has exactly eight themed buildings and one farm.
* [ ] Every location has a readable themed sign.
* [ ] Every signpost lists the location’s windows or plots.
* [ ] Every window is visually distinct and individually targetable.
* [ ] The About house has no technical skills list.
* [ ] Current roles appear in the train station.
* [ ] Past roles are divided between the workshop and schoolhouse.
* [ ] Findar and Bump appear in the observatory.
* [ ] GitHub Extension and Summer Schedule appear in the developer workshop.
* [ ] TerraLend, Unearthed Dinos, and WINFO Website appear in the greenhouse.
* [ ] KAW and Cyber Minds retain access to their project content.
* [ ] All overlays show their content on one scrollable screen.
* [ ] No repeated Space presses are required.
* [ ] Existing project videos autoplay muted and loop.
* [ ] Closing an overlay pauses and resets its video.
* [ ] The player character is feminine and pink.
* [ ] The train arrives when its button is used.
* [ ] Chickens run to feed when `Drop Feed` is used.
* [ ] Flowers appear with a cooldown and session cap.
* [ ] Envelopes fly from the post office chimney.
* [ ] The growth suggestion opens a prefilled email.
* [ ] Only one navigation bar is visible.
* [ ] The top navigation contains About, Experience, Projects, Growth, and Contact.
* [ ] Desktop, mobile, touch, keyboard, and reduced-motion behavior work.
* [ ] No animation can create unlimited objects.
* [ ] Existing project routes and classic pages remain accessible.
* [ ] `npm run build` succeeds.
* [ ] `npm run lint` succeeds or reports only deliberately documented existing warnings.

Do not stop after creating static mockups. Implement the actual game interactions, responsive overlays, content grouping, and classic-page equivalents.
