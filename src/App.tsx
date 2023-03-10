import {
    Fragment,
    useCallback,
    useEffect,
    useReducer,
    useRef,
    useState,
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
import { EditorView } from "@codemirror/view";

import { useHotkeys } from 'react-hotkeys-hook'
import CommandMenu from "./CommandMenu";

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
    const [allPaths, setAllPaths] = useState<FileEntry[]>([]);
    const [currentFileContent, setCurrentFileContent] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [currentFile, setCurrentFile] = useState({ name: "", path: "" });

    const [contextMenuSelectedNode, setContextMenuSelectedNode] = useState<HTMLElement | undefined>(undefined)

    const [showCommandWindow, setShowCommandWindow] = useState(false)

    const [metaData, setMetaData] = useState<any>({
        tags: [],
        files: {}
    })

    const [settings, setSettings] = useState({
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


    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (settings.mainFolder.value !== "") {
            saveSettings();
            readFiles();
            loadMetaData()
        } else {
        }
    }, [settings]);

    useEffect(() => {
        console.log(metaData)
        if (metaData.files.length != {}) {
            console.log("SAVING")
            saveMetaData()
        }
    }, [metaData])


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
        console.log(metaData)
        let s = metaData
        let setTags = new Set<string>()
        s.tags.forEach((t) => {
            setTags.add(t)
        })
        s.tags = Array.from(setTags)
        await writeTextFile(
            settings.mainFolder.value + "\\" + '.metaData',
            JSON.stringify(s, null, 2)
        )
    }

    const loadMetaData = async () => {
        try {
            await readTextFile(settings.mainFolder.value + "\\" + '.metaData').then((value) => {
                setMetaData(JSON.parse(value))
                console.log(value)
            })
        } catch (e) {
            saveMetaData()
        }

    }
    const addTagToFile = (tag: string, fileName: string) => {
        console.log(metaData.files)
        console.log(metaData.files[fileName.replace(".md", "")])
        let name = fileName.replace(".md", "")
        if (metaData.tags.includes(tag) && !metaData.files[name].tags.includes(tag)) {
            setMetaData(prev => ({ ...prev, files: { ...prev.files, [name]: { tags: [...prev.files[name].tags, tag] } } }))
        }
    }
    const removeTagFromFile = (tag: string, fileName: string) => {
        let name = fileName.replace(".md", "")
        if (metaData.tags.includes(tag) && metaData.files[name].tags.includes(tag)) {
            setMetaData(prev => ({ ...prev, files: { ...prev.files, [name]: { tags: [...prev.files[name].tags.filter(t => t !== tag)] } } }))
        }

    }
    const saveSettings = async () => {
        const path = await documentDir();
        await writeTextFile(
            path + "/LightWay" + "/LightWay.json",
            JSON.stringify(settings)
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
            setSettings(JSON.parse(set));
        } catch (error) {
            files = await createDir(path + "/LightWay", { recursive: true });
            await writeTextFile(
                path + "/LightWay" + "/LightWay.json",
                JSON.stringify(settings)
            );
        }
    };

    const createNewFile = async (name: string): Promise<boolean> => {
        try {
            setMetaData(prev => ({ ...prev, files: { ...prev.files, [name]: { tags: [] } } }))
            await writeTextFile(settings.mainFolder.value + "\\" + name + ".md", "");
            await readFiles();
            setCurrentFile({ name: name, path: settings.mainFolder.value + "\\" + name + ".md" });
            openNewFile(settings.mainFolder.value + "\\" + name, name);
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
            setCurrentFile({ name: name, path: path });
        }
    };

    const readFiles = async () => {
        if (settings.mainFolder.value != "") {
            const entries = await readDir(settings.mainFolder.value, {
                //   recursive: true,
            });
            setAllPaths(entries);
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
        if (currentFile.path != "" && currentFile.path.includes(".md")) {
            readFile(currentFile.path);
        } else {
        }
    }, [currentFile]);

    const deleteFile = async (name: string) => {
        console.log(currentFile.path + " " + name)
        if (currentFile.name == name) {
            console.log("yes")
            setCurrentFile({ path: "", name: "" });
            setCurrentFileContent("");
        }
        await invoke("delete_file", { path: settings.mainFolder.value + "\\" + name });
        await readFiles();
        setMetaData(prev => ({ ...prev, files: { ...prev.files, [name.replace('.md', "")]: { tags: [] } } }))
    };

    const onChange = useCallback(
        async (value: any) => {
            //save the file

            countWords(value);
            await writeTextFile(currentFile.path, value);

        },
        [currentFile.path]
    );

    const onCreateEditor = useCallback(
        async (view: EditorView, state: EditorState) => {

        },
        [currentFile.path]
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
        items: allPaths
    }
    const fileExists = (input: string) => {
        allPaths.forEach(element => {
            if (element.name == input) return true
        });
        return false
    }


    const anyFileBeginsWith = (input: string) => {
        let found = false
        allPaths.forEach(element => {
            if (element.name?.trim().toLowerCase().startsWith(input.toLowerCase().trim())) {
                found = true
            }
        })
        return found
    }

    const validFileName = (input: string) => {
        if (input.match(".*[<>:\"/\\|?*].*") != null) return false
        return true
    }
    const validateCreateInput = (input: string) => {
        return !fileExists(input) && validFileName(input)
    }

    useEffect(() => {

    }, [selectedCommandMenuItem])
    useEffect(() => {
        setSelectedCommandMenuItem("")
        if (searchString.startsWith(commandPrefix)) {
            //is a command
            let command = searchString.trim().split(' ')[0].substring(1)
            let fileName = searchString.trim().split(' ')[1]
            if (command == "create" && fileName != undefined) {
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
            }
        } else {
            //is an open/create file
            if (!validFileName(searchString)) {
                setCommandMenuError('invalid file name')
            } else {
                setCommandMenuError("")
            }
        }
    }, [searchString])

    useEffect(() => {

    }, [commandMenuError])

    const renderSearch = () => {
        //filter and order items 

        //filter each list based off the input string
        let files = filesList.items.filter((file: any) => {
            return (
                (file.name!.toLowerCase().includes(searchString.trim().toLowerCase()) || file.name!.toLowerCase().includes(searchString.trim().toLowerCase().replace(commandPrefix + 'delete', "").trimStart())) &&
                isFileOrFolder(file.path) == "file"
            );
        });

        files = files.sort((a: any, b: any) => {
            return a.name!.toLowerCase().localeCompare(b.name!.toLowerCase());
        });

        let commands = commandList.items.filter((command: any) => {
            return (command.name).toLowerCase().includes(searchString.trim().toLowerCase())
        })
        let masterList = []

        files.forEach((item) => masterList.push(item.name))
        commands.forEach((item) => masterList.push(item.name))

        if (selectedCommandMenuItem === "") setSelectedCommandMenuItem(masterList[selection])

        if (selectedCommandMenuItem == undefined && masterList.length > 0) {
            setSelectedCommandMenuItem(masterList[0])
            setSelection(0)
        }

        if (selection > masterList.length - 1) {
            setSelection(masterList.length - 1)
            setSelectedCommandMenuItem(masterList[masterList.length - 1])
        }
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
                    let command = searchString.trim().split(' ')[0].substring(1)
                    let fileName = searchString.trim().split(' ')[1]

                    if (command == "create") {
                        if (validateCreateInput(fileName)) {
                            createNewFile(fileName).then((value) => {
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

                        if (!metaData.tags.includes(fileName)) {
                            setMetaData(prev => ({ ...prev, tags: [...prev.tags, fileName] }))
                            setShowCommandWindow(false)
                        }
                    } else if (command == "addTagToFile") {
                        addTagToFile(fileName, currentFile.name)
                        setShowCommandWindow(false)
                    } else if (command == "removeTagFromFile") {
                        removeTagFromFile(fileName, currentFile.name)
                        setShowCommandWindow(false)
                    }
                } else {
                    if (files.length == 0 && searchString.trim() != "") createNewFile(searchString.trim())
                    else {
                        let entry = files[selection];
                        setCurrentFile({ name: entry.name!, path: entry.path })
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
                    let toComplete = split[split.length - 1]

                    let res = ""
                    split.pop()
                    split.forEach((s) => {
                        res += " " + s
                    })
                    res += " " + masterList[selection]

                    setSearchString(res.trim())
                    setSelection(0)
                    setSelectedCommandMenuItem(masterList[0])
                }
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

                    <CommandMenu error={commandMenuError} description={filesList.description} list={files} selection={selectedCommandMenuItem} />

                    <CommandMenu error={commandMenuError} description={commandList.description} list={commands} selection={selectedCommandMenuItem} />
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
                        {currentFile.name}
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
                                <div>{currentFile.path != "" ? (

                                    <TestHarness>

                                        <Editor
                                            onCreateEditor={onCreateEditor}
                                            onChange={onChange}
                                            currentFileContent={currentFileContent}
                                            currentFilePath={currentFile.path}
                                            className=" focus:outline-solid text-white"
                                            settings={settings}
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

                {settings.mainFolder.value !== "" ? (
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
