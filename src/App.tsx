import {
    Fragment,
    ReactNode,
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
import { VscChromeMaximize, VscEdit, VscTrash } from "react-icons/vsc";
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

//TODO:
function App() {
    const [mainFolder, setMainFolder] = useState<string | undefined>(undefined);
    const [allPaths, setAllPaths] = useState<FileEntry[]>([]);
    const [currentFileContent, setCurrentFileContent] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [settingsModal, setSettingsModal] = useState(false);
    const [currentFile, setCurrentFile] = useState({ name: "", path: "" });

    const [contextMenuSelectedNode, setContextMenuSelectedNode] = useState<HTMLElement | undefined>(undefined)

    const [showCommandWindow, setShowCommandWindow] = useState(false)

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

    const renaming = useRef("");

    //Setting the window to frameless
    appWindow.setDecorations(false);

    const minimize = () => appWindow.minimize();
    const maximize = () => appWindow.toggleMaximize();
    const close = () => appWindow.close();

    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });

    const [changeFile, setChangeFile] = useState(false);
    // const [DOMreloaded, setDOMreloaded] = useState(false);
    const [searchString, setSearchString] = useState("");

    const [fileHeadingDisplay, setFileHeadingDisplay] = useState<
        ReactNode | undefined
    >();

    // let changeFile = useRef(false);
    //const [id, forceUpdate] = useReducer((x) => x + 1, 0);
    useEffect(() => {
        console.log(showCommandWindow)
    }, [showCommandWindow])
    useHotkeys('control+p', event => {
        console.log("hotkey")
        event.preventDefault()
        setShowCommandWindow(!showCommandWindow)
        setSearchString("")
    },
        {
            enableOnFormTags: true,
            enableOnContentEditable: true,
        }
    )

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (settings.mainFolder.value !== "") {
            saveSettings();
            readFiles();

        } else {
        }
    }, [settings]);

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
        console.log(path);
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

    const createNewFolder = async () => {
        let num = 0;
        let loop = true;

        let newFolderName = settings.mainFolder.value + "\\" + "Untitled";

        while (loop) {
            try {
                await createDir(newFolderName);
                loop = false;
            } catch (error) {
                num += 1;
                newFolderName = settings.mainFolder.value + "\\" + "Untitled " + num;
            }
        }

        await readFiles();
        renaming.current = newFolderName;
    };

    const handleContextMenu = useCallback(
        (event: {
            preventDefault: () => void;
            pageX: any;
            pageY: any;
            target: HTMLElement;
        }) => {
            event.preventDefault();
            console.log("conttext")
            setAnchorPoint({ x: event.pageX, y: event.pageY });
            if (contextMenuSelectedNode) {
                setContextMenuSelectedNode(undefined)
            } else {
                setContextMenuSelectedNode(event.target)
                console.log("setting target ", event.target)
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
            console.log(entries)
        }
    };
    const customEvent = new CustomEvent("file-read");
    const readFile = async (path: string) => {
        //console.log(path);
        const file = await readTextFile(path);
        setCurrentFileContent(file);
        setChangeFile(true);
        document.dispatchEvent(customEvent);
    };

    const countWords = (str: string) => {
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
            console.log(currentFile)
        }
    }, [currentFile]);

    const deleteFile = async (path: string) => {
        console.log(currentFile.path + " " + path)
        if (currentFile.path == path) {
            console.log("yes")
            setCurrentFile({ path: "", name: "" });
            setCurrentFileContent("");
        }
        await invoke("deleteFile", { path: path });
        await readFiles();
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
    const [selection, setSelection] = useState(0);
    const command_prefix = '/'
    const command_noun = [
        { name: "create" },
        { name: "delete" },
        { name: "copy" }
    ]
    const renderSearch = () => {
        let files = []
        if (searchString.startsWith(command_prefix) && !searchString.startsWith(command_prefix + "delete")) {
            files = command_noun.filter((command: any) => {
                return (command_prefix + command.name).toLowerCase().includes(searchString.toLowerCase())
            })
        } else {
            if (searchString == "") {
                files = allPaths.filter((file: any) => {
                    return isFileOrFolder(file.path) == "file"
                })
            } else {
                let ss = searchString
                if (searchString.startsWith(command_prefix + "delete")) ss = searchString.replace(command_prefix + 'delete', '').trim()
                files = allPaths.filter((file: any) => {
                    return (
                        file.name!.toLowerCase().includes(ss.toLowerCase()) &&
                        isFileOrFolder(file.path) == "file"
                    );
                });

            }

            files = files.sort((a: any, b: any) => {
                return a.name!.toLowerCase().localeCompare(b.name!.toLowerCase());
            });

        }
        document.addEventListener('keydown', (e) => {

            if (e.key == "ArrowDown") {
                document.getElementById(files[(selection < files.length - 1 ? selection + 1 : 0)].name)?.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center'

                })
                selection < files.length - 1 ? setSelection(selection + 1) : setSelection(0);
            } else if (e.key == "ArrowUp") {
                document.getElementById(files[(selection > 0 ? selection - 1 : files.length - 1)].name)?.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center'

                })
                selection > 0 ? setSelection(selection - 1) : setSelection(files.length - 1)
            } else if (e.key == "Enter") {
                if (searchString.startsWith(command_prefix)) {
                    console.log("command")
                    let command = searchString.split(' ')[0].substring(1)
                    let fileName = searchString.split(' ')[1]
                    console.log(command)
                    console.log(fileName)

                    if (command == "create") {
                        createNewFile(fileName).then((value) => {
                            console.log(value)
                            if (value) {
                                setShowCommandWindow(false)
                            }
                        })

                    } else if (command == "delete") {
                        let name = files[selection];
                        deleteFile(name.path)
                        setShowCommandWindow(false)
                    } else if (command == "copy") {

                    }
                } else {
                    if (files.length == 0 && searchString != "") createNewFile(searchString)
                    else {
                        let entry = files[selection];
                        setCurrentFile({ name: entry.name!, path: entry.path })
                    }
                    setShowCommandWindow(false)
                    setSearchString("")
                    setSelection(0)
                }
            } else if (e.key == "Tab") {
                e.preventDefault()
                if (searchString.startsWith(command_prefix)) {
                    let s = (command_prefix+ files[selection].name).replace(searchString, "")
                    setSearchString(searchString + s + " ")
                } else {
                    let s = (files[selection].name).replace(searchString, "")
                    setSearchString(searchString + s)
                }
                setSelection(0)
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
                    <div className="flex flex-col h-full justify-center hover-border-none transition-colors max-h-[50vh] hover:border-zinc-600 bg-slate-800  border-zinc-700">
                        <div className="flex w-full flex-row" >
                            <div className="ml-5 w-[50%] block text-left text-zinc-400">
                                {files.length == 0 && searchString != "" && !searchString.startsWith(command_prefix) ? <div>Create file called: {searchString}</div> : (searchString.startsWith(command_prefix) ? <div>Execute a command</div> : <div> Open a file</div>)}
                            </div>

                            <div className="mr-5 w-[50%] block text-right text-zinc-400">
                                {files.length} results
                            </div>
                        </div>
                        <div className="flex flex-col h-full w-full overflow-auto duration-700">
                            {
                                files.map((entry: any, index) => {
                                    return (
                                        <div className="text-start" id={entry.name}>
                                            <button
                                                onClick={() =>
                                                    setCurrentFile({ name: entry.name, path: entry.path })
                                                }

                                                className={index == selection ? " h-fit hover:text-zinc-200 bg-zinc-800 border-none focus:border-none focus:outline-none  rounded-none w-full text-start" : "bg-transparent h-fit hover:text-zinc-200 hover:bg-zinc-900 border-none focus:border-none focus:outline-none  rounded-none w-full text-start"}
                                            >
                                                {entry.name}
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
