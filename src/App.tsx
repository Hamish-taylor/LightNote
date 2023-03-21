import {
    Fragment,
    useCallback,
    useEffect,
    useReducer,
    useState,
    useRef,
} from "react";
import "./App.css";

import { appWindow } from "@tauri-apps/api/window";
import {
    MdClear,
    MdMinimize,
} from "react-icons/md";
import { VscChromeMaximize } from "react-icons/vsc";
import {
    readDir,
    FileEntry,
    readTextFile,
    writeTextFile,
    createDir,
} from "@tauri-apps/api/fs";

import { fs, invoke } from "@tauri-apps/api";

import Editor from "./Editor";

import { documentDir } from "@tauri-apps/api/path";
import SplashScreen from "./SplashScreen";

import { EditorState } from "@codemirror/state";
import { Command, EditorView } from "@codemirror/view";

import { useHotkeys } from 'react-hotkeys-hook'
import CommandMenu from "./CommandMenu";
import CommandRegistry from "./CommandRegistry";
import { cursorDocEnd } from "@codemirror/commands";

function TestHarness({ children }: { children?: React.ReactNode }) {
    const [id, forceUpdate] = useReducer((x) => x + 1, 0);

    document.addEventListener("file-read", () => {
        forceUpdate();
        // setChangeFile(false);
    });

    return (
        <>
            <Fragment key={id}>{children}</Fragment>
        </>
    );
}

export const isFileOrFolder = (path: string) => {
    const re = new RegExp("[.][a-z]*");
    if ((path.toLowerCase()).endsWith(".md")) {
        return "file";
    } else if (re.test(path)) {
        return "none";
    }
    return "folder";
};

function App() {
    const [mainFolder, setMainFolder] = useState<string | undefined>(undefined);
    //const [allPaths, setAllPaths] = useState<FileEntry[]>([]);
    const allPaths = useRef<FileEntry[]>([])
    const [currentFileContent, setCurrentFileContent] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const currentFile = useRef({ name: "", path: "" });

    const [contextMenuSelectedNode, setContextMenuSelectedNode] = useState<HTMLElement | undefined>(undefined)

    const [showCommandWindow, setShowCommandWindow] = useState(false)

    const [commands, setCommands] = useState<{ name: string }[]>([])
    const [files, setFiles] = useState<FileEntry[]>([])

    const settings = useRef({
        editorWidth: {
            name: "Editor Width",
            description: "The width of the editor in pixels",
            value: 700,
            range: [100, 1000],
            type: "number",
        },
        mainFolder: {
            name: "Main Folder",
            description: "The main folder to use",
            value: "",
            type: "path",
        },
        testCheck: {
            name: "Test Check",
            description: "A test check",
            value: false,
            type: "toggle",
        },
    });

    //Setting the window to frameless
    appWindow.setDecorations(false);

    const minimize = () => appWindow.minimize();
    const maximize = () => appWindow.toggleMaximize();
    const close = () => appWindow.close();

    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });

    // const [DOMreloaded, setDOMreloaded] = useState(false);
    const [searchString, setSearchString] = useState("");

    const [commandMenuError, setCommandMenuError] = useState("")
    const [selection, setSelection] = useState(0);
    const [selectedCommandMenuItem, setSelectedCommandMenuItem] = useState("")



    const [commandRegistry, setCommandRegistry] = useState(new CommandRegistry());


    useEffect(() => {
        loadSettings();
        console.log("adding command")
        commandRegistry.register({
            name: "/create",
            description: "Create a new file",
            execute: async (args: string[]) => {
                if (commandMenuError == "") {
                    console.log("exicuting command")
                    try {
                        invoke("add_file", { file: args[0] })
                        saveMetaData()
                        await writeTextFile(settings.current.mainFolder.value + "\\" + args[0] + ".md", "");
                        await readFiles();
                        currentFile.current = { name: args[0], path: settings.current.mainFolder.value + "\\" + args[0] + ".md" };
                        openNewFile(settings.current.mainFolder.value + "\\" + args[0], args[0]);
                        return true
                    } catch (error) {
                        console.log("cannot create file " + error)
                        return false
                    }

                }
                return false;
            },
            display: (args: string[]) => {
                let f = filesList.items.filter((file: any) => {
                    return (
                        file.name!.toLowerCase().includes(args[0].trim().toLowerCase())
                        && file.name!.toLowerCase().trim() !== currentFile.current.name.toLowerCase().trim()
                        && isFileOrFolder(file.path) == "file"
                        && file.name!.toLowerCase().trim() != args[0].trim().toLowerCase()
                    );
                });

                f = f.sort((a: any, b: any) => {
                    return a.name!.toLowerCase().localeCompare(b.name!.toLowerCase());
                });
                return f;
            },
            errorCheck: (args: string[]) => {
                if (args[0].trim() == "") return 'please enter a file name'
                if (!validFileName(args[0])) return 'invalid file name'
                else if (fileExists(args[0])) return 'file already exists'
                return ""

            }
        })

        commandRegistry.register({
            name: "/delete",
            description: "Delete a file",
            execute: async (args: string[]) => {
                if (!args[0].endsWith(".md")) args[0] += ".md"
                try {
                    if (currentFile.current.name.replace(".md", "") === args[0].replace(".md", "")) {
                        currentFile.current = { path: "", name: "" };
                        setCurrentFileContent("");
                    }
                    await invoke("delete_file", { path: settings.current.mainFolder.value + "\\" + args[0] + ".md" });
                    await invoke("remove_file", { file: args[0].replace(".md", "") })
                    await readFiles();

                } catch (error) {
                    return false
                }
                return true
            },
            display: (args: string[]) => {
                return allPaths.current.filter((p) => {
                    return p.path.endsWith(".md") && p.name?.toLowerCase().trim().startsWith(args[0].toLowerCase().trim()) 
                })
            },
            errorCheck: (args: string[]) => {
                if (!anyFileBeginsWith(args[0])) return 'file does not exist'
                return ""
            }



        })


    }, []);

    useEffect(() => {
        if (settings.current.mainFolder.value !== "") {
            saveSettings();
            readFiles();
            invoke("load_config", { path: settings.current.mainFolder.value + "\\" + ".metadata" })
        } else {
        }
    }, [settings.current]);


    useHotkeys('control+p', event => {
        event.preventDefault()
        setShowCommandWindow(!showCommandWindow)
        setSearchString("")
    },
        {
            enableOnFormTags: true,
            enableOnContentEditable: true,
        }
    )

    const saveMetaData = async () => {
        console.log(settings.current.mainFolder.value + "\\" + '.metaData')
        if (settings.current.mainFolder.value != "") {
            invoke('save_config', { path: settings.current.mainFolder.value + "\\" + '.metaData' })
        }
    }


    const addTagToFile = (tag: string, fileName: string) => {
        invoke('add_tag_to_file', { file: fileName.replace('.md', ""), tag: tag })
        saveMetaData()
    }

    const addTag = (tag: string) => {
        console.log("adding tag")
        invoke("add_tag", { tag: tag })
        saveMetaData()
    }
    const removeTagFromFile = (tag: string, fileName: string) => {
        invoke('remove_tag_from_file', { file: fileName.replace(".md", ""), tag: tag })
        saveMetaData()
    }
    const saveSettings = async () => {
        const path = await documentDir();
        await writeTextFile(
            path + "/LightWay" + "/LightWay.json",
            JSON.stringify(settings.current)
        );
    };
    const loadSettings = async () => {
        let files = undefined;
        const path = await documentDir();
        try {
            files = await readDir(path + "/LightWay", { recursive: true });
            let set = await readTextFile(
                path + "/LightWay" + "/LightWay.json"
            ).then();
            setMainFolder(JSON.parse(set).mainFolder.value);
            settings.current = JSON.parse(set);
        } catch (error) {
            files = await createDir(path + "/LightWay", { recursive: true });
            await writeTextFile(
                path + "/LightWay" + "/LightWay.json",
                JSON.stringify(settings.current)
            );
        }
    };

    const createFile = async (name: string): Promise<boolean> => {
        try {
            invoke("add_file", { file: name })
            saveMetaData()
            await writeTextFile(settings.current.mainFolder.value + "\\" + name + ".md", "");
            await readFiles();
            currentFile.current = { name: name, path: settings.current.mainFolder.value + "\\" + name + ".md" };
            openNewFile(settings.current.mainFolder.value + "\\" + name, name);
            return true
        } catch (error) {
            console.log("cannot create file " + error)
            return false
        }
    };

    const handleContextMenu = useCallback(
        (event: {
            preventDefault: () => void;
            pageX: any;
            pageY: any;
            target: HTMLElement;
        }) => {
            event.preventDefault();
            setAnchorPoint({ x: event.pageX, y: event.pageY });
            if (contextMenuSelectedNode) {
                setContextMenuSelectedNode(undefined)
            } else {
                setContextMenuSelectedNode(event.target)
            }
        },
        [setAnchorPoint]
    );

    const handleContextClick = useCallback(
        () =>
            contextMenuSelectedNode
                ? (setContextMenuSelectedNode(undefined))
                : null,
        [contextMenuSelectedNode]
    );

    useEffect(() => {
        document.addEventListener("click", handleContextClick);
        //@ts-ignore
        document.addEventListener("contextmenu", handleContextMenu);
        return () => {
            document.removeEventListener("click", handleContextClick);
            //@ts-ignore
            document.removeEventListener("contextmenu", handleContextMenu);
        };
    });

    const openNewFile = async (path: string, name: string) => {
        if (name.includes(".md")) {
            currentFile.current = { name: name, path: path };
        }
    };

    const readFiles = async () => {
        if (settings.current.mainFolder.value != "") {
            const entries = await readDir(settings.current.mainFolder.value, {
                //   recursive: true,
            });
            let n: FileEntry[] = []
            entries.forEach((e) => {
                n.push({ name: e.name.replace(".md", ""), path: e.path })
            })
            console.log()
            allPaths.current = n;
        }
    };
    const customEvent = new CustomEvent("file-read");
    const readFile = async (path: string) => {
        const file = await readTextFile(path);
        setCurrentFileContent(file);
        document.dispatchEvent(customEvent);
    };

    const countwords = (str: string) => {
        var count = 0;
        str.split(/\s+/).forEach((str) => {
            str.length > 0 ? count++ : null;
        });
        setWordCount(count);
    };

    useEffect(() => {
        if (currentFile.current.path != "" && currentFile.current.path.includes(".md")) {
            readFile(currentFile.current.path);
        } else {
        }
    }, [currentFile.current]);

    const deleteFile = async (name: string) => {
        console.log(currentFile.current.name + " " + name)
        if (currentFile.current.name === name.replace(".md", "")) {
            console.log("yes")
            currentFile.current = { path: "", name: "" };
            setCurrentFileContent("");
        }
        await invoke("delete_file", { path: settings.current.mainFolder.value + "\\" + name });
        await invoke("remove_file", { file: name.replace(".md", "") })
        await readFiles();
    };

    const onChange = useCallback(
        async (value: any) => {
            //save the file

            countwords(value);
            await writeTextFile(currentFile.current.path, value);

        },
        [currentFile.current.path]
    );

    const onCreateEditor = useCallback(
        async (view: EditorView, state: EditorState) => {

        },
        [currentFile.current.path]
    );

    useEffect(() => {
        document.getElementById("");
    }, []);
    const commandPrefix = '/'
    const commandList = {
        description: "execute command",
        items: [
            { name: commandPrefix + "create" },
            { name: commandPrefix + "delete" },
            { name: commandPrefix + "duplicate" },
            { name: commandPrefix + "addTag" },
            { name: commandPrefix + "addTagToFile" },
            { name: commandPrefix + "removeTagFromFile" },

        ]
    }
    const filesList = {
        description: "open file",
        items: allPaths.current
    }
    const fileExists = (input: string) => {
        console.log(allPaths.current)
        let ret = false;
        if (!input.endsWith(".md")) input += ".md"
        allPaths.current.forEach(element => {
            console.log(element.name + ":" + input)
            if (element.name + ".md" === input) {
                ret = true;
            }
        });
        return ret
    }


    const anyFileBeginsWith = (input: string) => {
        let found = false
        allPaths.current.forEach(element => {
            if (element.name?.trim().toLowerCase().startsWith(input.toLowerCase().trim())) {
                found = true
            }
        })
        return found
    }

    const validFileName = (input: string) => {
        if (input.match(".*[<>:\"/\\|?*].*") != null) return false
        if (input.endsWith(".md")) return false
        return true
    }
    const validateCreateInput = (input: string) => {
        return !fileExists(input) && validFileName(input)
    }

    useEffect(() => {

    }, [selectedCommandMenuItem])
    useEffect(() => {
        const validateCommands = async () => {
            //let rawMetadata: string = await invoke("get_config", { path: settings.current.mainFolder.value + "\\" + ".metaData" })
            //let metaData = JSON.parse(rawMetadata)

            setSelectedCommandMenuItem("")
            if (searchString.startsWith(commandPrefix)) {
                //is a command
                let command = searchString.trim().split(' ')[0]
                let fileName = searchString.trim().split(' ')[1]

                let c = commandRegistry.getCommand(command);
                console.log(c)
                console.log(c.errorCheck([fileName]))
                setCommandMenuError(c.errorCheck([fileName]));


                /** if (command == "create" && fileName != undefined) {
                     if (!validFileName(fileName)) setCommandMenuError('invalid file name')
                     else if (fileExists(fileName)) setCommandMenuError('file already exists')
                     else setCommandMenuError("")
                 } else if (command == "delete" && fileName != undefined && fileName != "") {
                     if (!anyFileBeginsWith(fileName)) setCommandMenuError('file does not exist')
                     else setCommandMenuError("")
                 } else if (command == "addTagToFile") {
                     if (currentFile.name == "") {
                         setCommandMenuError('Cannot add tag as no file is open')
                     } else if (metaData.files[currentFile.name.replace(".md", "")].tags.includes(fileName)) {
                         setCommandMenuError('tag already exists on file')
                     } else if (!metaData.tags.includes(fileName)) {
                         setCommandMenuError("tag does not exist")
                     } else {
                         setCommandMenuError("")
                     }
                 } else if (command == "addTag") {
                     if (metaData.tags.includes(fileName)) {
                         setCommandMenuError('tag already exists')
                     } else {
                         setCommandMenuError("")
                     }
                 } else if (command == "removeTagFromFile") {
                     if (currentFile.name == "") {
                         setCommandMenuError('Cannot remove tag as no file is open')
                     } else if (!metaData.files[currentFile.name.replace(".md", "")].tags.includes(fileName)) {
                         setCommandMenuError('tag doesnt exist on the file')
 
                     } else if (!metaData.tags.includes(fileName)) {
                         setCommandMenuError("tag does not exist")
                     }
                     else {
                         setCommandMenuError("")
                     }
                 } else {
                     setCommandMenuError("")
                 }*/
            } else {
                //is an open/create file
                if (!validFileName(searchString)) {
                    setCommandMenuError('invalid file name')
                } else {
                    setCommandMenuError("")
                }
            }
        }
        validateCommands();
    }, [searchString])

    useEffect(() => {

    }, [commandMenuError])

    const renderSearch = () => {
        //filter and order items 
        //let metadata = await JSON.parse(await invoke("get_config", { path: settings.current.mainFolder.value + "\\" + ".metadata" }))
        let masterList: any[] = []

        let c = commandRegistry.getCommands().filter((c: any) => {
            return ((c.name).toLowerCase().includes(searchString.trim().toLowerCase().replace(commandPrefix, "")) && c.name!.toLowerCase().trim() != searchString.trim().toLowerCase())

        });


        let f = filesList.items.filter((file: any) => {
            return (
                file.name!.toLowerCase().includes(searchString.trim().toLowerCase())
                //&& file.name!.toLowerCase().trim() !== currentFile.name.toLowerCase().trim()
                && isFileOrFolder(file.path) == "file"
                && file.name!.toLowerCase().trim() != searchString.trim().toLowerCase()
            );
        });
        f = f.sort((a: any, b: any) => {
            return a.name!.toLowerCase().localeCompare(b.name!.toLowerCase());
        });

        if (searchString.startsWith("/")) {
            let command = searchString.trim().split(' ')[0]
            let fileName = searchString.trim().split(' ')[1]
            let com = commandRegistry.getCommand(command)
            if (com != null) {
                c = []
                f = []
                if (fileName == null || fileName == undefined) {
                    fileName = ""
                }
                let res = com.display([fileName]);
                res.forEach((f) => {
                    masterList.push(f.name)
                })
                res.forEach((f) => {
                    c.push(f)
                })
            }
        }
        f.forEach((item) => masterList.push(item.name))
        c.forEach((item) => masterList.push(item.name))

        /** 
                let f = filesList.items.filter((file: any) => {
                    return (
                        (
                            (
                                (file.name!.toLowerCase().includes(searchString.trim().toLowerCase()) && file.name!.toLowerCase().trim() !== currentFile.name.toLowerCase().trim())
                                || (searchString.startsWith(commandPrefix + "delete") && file.name!.toLowerCase().includes(searchString.trim().toLowerCase().replace(commandPrefix + 'delete', "").trimStart()) && file.name!.toLowerCase() !== searchString.trim().toLowerCase().replace(commandPrefix + 'delete', "").trimStart()
                                )
                            ) &&
                            isFileOrFolder(file.path) == "file") && file.name!.toLowerCase().trim() != searchString.trim().toLowerCase()
         
                    );
                });
                f = f.sort((a: any, b: any) => {
                    return a.name!.toLowerCase().localeCompare(b.name!.toLowerCase());
                });
         
                let c = commandList.items.filter((command: any) => {
                    return ((command.name).toLowerCase().includes(searchString.trim().toLowerCase()) && command.name!.toLowerCase().trim() != searchString.trim().toLowerCase())
         
                })
                if (currentFile.name == "") {
                    console.log("no file open")
                    c = c.filter((command: any) => {
                        console.log(command.name != commandPrefix + "addTagToFile")
                        return command.name !== (commandPrefix + "addTagToFile") && command.name !== (commandPrefix + "removeTagFromFile")
                    })
                }
         
                //filter each list based off the input string
                let masterList: any[] = []
         
                f.forEach((item) => masterList.push(item.name))
                c.forEach((item) => masterList.push(item.name))
                if (searchString.startsWith(commandPrefix + "addTagToFile")) {
                    let t = metadata['tags']
                    t = t.filter((tag: string) => {
                        return tag.trim().toLowerCase().includes(searchString.replace(commandPrefix + "addTagToFile", "").trim().toLowerCase()) && tag.toLowerCase().trim() != searchString.replace(commandPrefix + "addTagToFile", "").trim().toLowerCase()
                    })
         
                    t.forEach((i: any) => {
                        c.push({ name: i })
                    })
                    t.forEach((i: any) => {
                        masterList.push(i)
                    })
                }
                if (searchString.startsWith(commandPrefix + "removeTagFromFile")) {
                    let t = metadata['files'][currentFile.name.replace(".md", "")]["tags"]
                    t = t.filter((tag: string) => {
                        return tag.trim().toLowerCase().includes(searchString.replace(commandPrefix + "removeTagFromFile", "").trim().toLowerCase()) && tag.toLowerCase().trim() != searchString.replace(commandPrefix + "removeTagFromFile", "").trim().toLowerCase()
                    })
         
                    t.forEach((i: any) => {
                        c.push({ name: i })
                    })
                    t.forEach((i: any) => {
                        masterList.push(i)
                    })
                }
        */
        if (selectedCommandMenuItem === "") setSelectedCommandMenuItem(masterList[selection])

        if (selectedCommandMenuItem == undefined && masterList.length > 0) {
            setSelectedCommandMenuItem(masterList[0])
            setSelection(0)
        }

        if (selection > masterList.length - 1) {
            setSelection(masterList.length - 1)
            setSelectedCommandMenuItem(masterList[masterList.length - 1])
        }
        //if (f.length != files.length) setFiles(f)
        //if (c.length != commands.length) setCommands(c)

        //handle key inputs
        document.addEventListener('keydown', (e) => {

            if (e.key == "ArrowDown") {
                e.preventDefault()
                document.getElementById(masterList[(selection < files.length - 1 ? selection + 1 : 0)])?.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center'

                })
                selection < masterList.length - 1 ? setSelection(selection + 1) : setSelection(0);
                setSelectedCommandMenuItem(masterList[selection < masterList.length - 1 ? selection + 1 : 0])
            } else if (e.key == "ArrowUp") {
                e.preventDefault()
                document.getElementById(masterList[(selection > 0 ? selection - 1 : files.length - 1)])?.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center'

                })
                selection > 0 ? setSelection(selection - 1) : setSelection(masterList.length - 1)
                setSelectedCommandMenuItem(masterList[selection > 0 ? selection - 1 : masterList.length - 1])
            } else if (e.key == "Enter" && commandMenuError == "") {

                if (searchString.trim().startsWith(commandPrefix)) {
                    let command = searchString.trim().split(' ')[0]
                    let fileName = searchString.trim().split(' ')[1]

                    let c = commandRegistry.getCommand(command.toLowerCase());
                    c.execute([fileName]).then((r) => {
                        if (r) setShowCommandWindow(false)
                    });

                    /** if (command == "create") {
                         if (validateCreateInput(fileName)) {
                             createFile(fileName).then((value) => {
                                 if (value) {
                                     setShowCommandWindow(false)
                                 }
                             })
                         } else {
                             setCommandMenuError("invalid file name")
                         }
         
                     } else if (command == "delete") {
                         let name = masterList[selection];
                         deleteFile(name)
                         setShowCommandWindow(false)
                     } else if (command == "duplicate") {
         
                     } else if (command == "addTag") {
                         addTag(fileName)
                         setShowCommandWindow(false)
                     } else if (command == "addTagToFile") {
                         addTagToFile(fileName, currentFile.name)
                         setShowCommandWindow(false)
                     } else if (command == "removeTagFromFile") {
                         console.log(fileName)
                         removeTagFromFile(fileName, currentFile.name)
                         setShowCommandWindow(false)
                     }*/
                } else {
                    if (files.length == 0 && searchString.trim() != "") createFile(searchString.trim())
                    else {
                        let entry = files[selection];
                        currentFile.current = { name: entry.name!, path: entry.path };
                        document.getElementById("")
                    }
                    setShowCommandWindow(false)
                    setSearchString("")
                    setSelection(0)
                    setSelectedCommandMenuItem(masterList[0])
                }
            } else if (e.key == "Tab") {
                e.preventDefault()
                if (masterList[selection] != null) {
                    let split = searchString.split(' ')

                    let res = ""
                    split.pop()
                    split.forEach((s) => {
                        res += " " + s
                    })
                    res += " " + masterList[selection]

                    setSearchString(res.trim() + " ")
                    setSelection(0)
                    setSelectedCommandMenuItem(masterList[0])
                }
            } else if (e.key == "Escape") {
                setShowCommandWindow(false);
            }

        }, { once: true })
        return (
            <div className=" flex left-0 right-0 w-fit m-auto flex-col h-fit z-30">
                <div className="flex self-center w-1/2 flex-col fixed z-10">
                    <div className=" justify-center min-w-max">
                        <input
                            type="text"
                            onChange={(e) => setSearchString(e.target.value)}
                            placeholder="Search…"
                            className="input w-full outline-none rounded-none focus:outline-none focus:border-none"
                            autoFocus
                            value={searchString}
                        />
                    </div>
                    <div className="flex w-full bg-red-600 text-white" >
                        <div className="ml-5 w-full block text-left text-zinc-400">
                            <div className=" w-full text-white">{commandMenuError != "" ? commandMenuError : null}</div>
                        </div>
                    </div>

                    <CommandMenu error={commandMenuError} description={filesList.description} list={f} selection={selectedCommandMenuItem} />

                    <CommandMenu error={commandMenuError} description={commandList.description} list={c} selection={selectedCommandMenuItem} />

                </div>
            </div>
        );
    }



    return (
        <div>
            <div className="z-0 bg-zinc-900 flex flex-col w-screen h-screen overflow-hidden ">
                <div
                    data-tauri-drag-region
                    className="z-50 flex  w-screen right-0 left-0 justify-end bg-zinc-900 text-center text-white"
                >
                    <span
                        data-tauri-drag-region
                        className="absolute text-center justify-center place-self-center w-full cursor-default  text-xs  z-10"
                    >
                        {currentFile.current.name}
                    </span>
                    <button
                        onClick={minimize}
                        className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none bg-center z-20"
                    >
                        <MdMinimize className="flex-1" />
                    </button>
                    <button
                        onClick={maximize}
                        className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none z-20"
                    >
                        <VscChromeMaximize />
                    </button>
                    <button
                        onClick={close}
                        className="bg-zinc-900 hover:bg-red-600 rounded-none border-none focus:outline-none z-20"
                    >
                        <MdClear />
                    </button>
                </div>
                {mainFolder !== undefined ? (
                    mainFolder === "" ? (
                        <SplashScreen loadSettings={loadSettings}></SplashScreen>
                    ) : (
                        <div className="w-full h-full overflow-auto flex relative">
                            <div
                                id="contentPane"
                                className="bg-zinc-700 w-full overflow-auto h-full flex-1 flex-grow overflow-auto place-items-center "
                            >
                                <div> {showCommandWindow ? (
                                    <div onBlur={() => { setShowCommandWindow(false) }}
                                    >{renderSearch()} </div>

                                ) : (
                                    <></>
                                )}

                                </div>
                                <div>{currentFile.current.path != "" ? (

                                    <TestHarness>

                                        <Editor
                                            onCreateEditor={onCreateEditor}
                                            onChange={onChange}
                                            currentFileContent={currentFileContent}
                                            currentFilePath={currentFile.current.path}
                                            className=" focus:outline-solid text-white"
                                            settings={settings.current}
                                        />

                                    </TestHarness>

                                ) : (
                                    <div className="ml-0 mr-0 text-center mt-[20vh] text-zinc-300"> <text>Use <text className="text-teal-100">control+p</text> to open the command menu to create or open a file</text></div>
                                )}</div>
                            </div>
                        </div>
                    )
                ) : (
                    <></>
                )}

                {settings.current.mainFolder.value !== "" ? (
                    <div
                        data-tauri-drag-region
                        className="flex  w-screen h-8 justify-end bg-zinc-800 text-center"
                    >
                        <span
                            data-tauri-drag-region
                            className="text-center  place-self-center  cursor-default  text-sm  z-10 mr-8 text-zinc-400"
                        >
                            {wordCount} Words
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    );

}
export default App;
