# LightNote
A light-weight command based note-taking application written using Tauri, React, and Vite.

## Application goals
- Provide a minimal command based UI for creating, deleting, and opening markdown files. *Status: nearing completion, almost usable*
- Provide a tag based workflow where notes can be assigned user created tags to link and catogorize notes. All physical .md files will be stored inside of a single folder. The driving idea behind this workflow is to remove folders and to provide a more user friendly way of catagorizing notes. *Status: Initial stages of development, can create, add, and remove tags. Currently tags do nothing*
- Provide a powerfull plugin management system that can allow users to customize the existing UI and to add whatever features they want to create a fully personalised experience. *Status: To be started*


### Basic build instructions
#### Prerequisites
- Rust (https://www.rust-lang.org/tools/install)
- Node and npm (https://nodejs.org/en/download/)

#### Steps
1. Clone repository or download release source code
2. Navigate to the repo and run "npm install"
3. Use "npm run tauri dev" to run the application in development mode

