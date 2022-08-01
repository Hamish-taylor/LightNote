# LightNote
A light-weight note-taking application written using Tauri, React, and Vite.
Currently, the application is focused on just Markdown editing, as such it can only currently open .md files.

### IMPORTANT INFORMATION
*This is in very early stages of development!*
It contains the absolute bare minimum to be considered a Note-taking app, however, there are still many issues and caveats that would make the application all kinds of impossible to actually use. For example, currently, no preferences are saved, this means you will have to select your notes folder on every launch (This is of course definitely intentional and is 100% the final design).

The application in its current state is **Heavily** inspired by [Obsidian.md](https://obsidian.md/) (Check it out, it's much better than this project will ever be), the long term intention of the app is not to be a clone of obsidian, currently I am just using it as a guide to help teach me UI design before taking the application down its own path.


### Basic build steps (These are just from memory and are not tested... Sorry!)
1. Install rust 
2. Install Tauri using cargo (rusts packet manager) 
3. Install node and npm (usually comes with node)
4. Clone this repository 
5. Navigate to the repo and run the command "npm install"
6. To start the application run the command "npm run tauri dev"
