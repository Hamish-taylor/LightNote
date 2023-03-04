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

import { EditorState} from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import {useHotkeys} from 'react-hotkeys-hook'



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
	const [prevFileTreeWidth, setPrevFileTreeWidth] = useState<number>(300);
	const [currentFileContent, setCurrentFileContent] = useState("");
	const [wordCount, setWordCount] = useState(0);
	const [settingsModal, setSettingsModal] = useState(false);
	const [currentFile, setCurrentFile] = useState({ name: "", path: "" });

	const [sizes, setSizes] = useState([0, "fit", 0]);

	const [contextMenuSelectedNode, setContextMenuSelectedNode] = useState<HTMLElement | undefined>(undefined)

    const [showCommandWindow,setShowCommandWindow] = useState(false)

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

    useHotkeys('control+p', event => {
        console.log("hotkey")
        event.preventDefault()
        setShowCommandWindow(!showCommandWindow) 
    },
    {enableOnFormTags: ['input']}
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

	const createNewFile = async () => {
		let num = 0;
		let loop = true;
		let newFileName = "Untitled.md";

		while (loop) {
			try {
				await readTextFile(settings.mainFolder.value + "\\" + newFileName);
				num += 1;
				newFileName = "Untitled " + num + ".md";
			} catch (error) {
				await writeTextFile(settings.mainFolder.value + "\\" + newFileName, "");
				loop = false;
			}
		}

		await readFiles();
		setCurrentFile({ name: newFileName, path: settings.mainFolder.value });
		openNewFile(settings.mainFolder.value + "\\" + newFileName, newFileName);
		renaming.current = settings.mainFolder.value + "\\" + newFileName;
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


	const showSettingsModal = () => {
		setSettingsModal(!settingsModal);
	};

	const openNewFile = async (path: string, name: string) => {
		if (name.includes(".md")) {
			setCurrentFile({ name: name, path: path });
		}
	};

	const readFiles = async () => {
		if (settings.mainFolder.value != "") {
			const entries = await readDir(settings.mainFolder.value, {
				recursive: true,
			});
			setAllPaths(entries);
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
		//	const elem = document.getElementById(currentFile.path)!;
		//	if (elem) {
				console.log("reading file");
				readFile(currentFile.path);
		//	}
		}
	}, [currentFile]);

	const deleteFile = async (path: string) => {
		const p = path.replace(":name", "");
		if (currentFile.path == p) {
			setCurrentFile({ path: "", name: "" });
			setCurrentFileContent("");
		}
		if (isFileOrFolder(p) == "file") {
			await invoke("deleteFile", { path: p });
		} else if (isFileOrFolder(p) == "folder") {
			await invoke("deleteDir", { path: p });
		}
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


	const renderSearch = () => {
		let files = allPaths.filter((file: any) => {
			return (
				file.name!.toLowerCase().includes(searchString.toLowerCase()) &&
				isFileOrFolder(file.path) == "file"
			);
		});

		files = files.sort((a: any, b: any) => {
			return a.name!.toLowerCase().localeCompare(b.name!.toLowerCase());
		});

		document.addEventListener('keydown', (e) => {
			//console.log(e.key);
			//console.log(selection)

            if (e.key == "ArrowDown") {
			document.getElementById(files[ (selection < files.length - 1 ? selection + 1 : 0)].name)?.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center'             

            })
        	selection < files.length - 1 ? setSelection(selection + 1) : setSelection(0);
.input-group :last-child
			} else if (e.key == "ArrowUp") {
			document.getElementById(files[(selection > 0 ? selection - 1 : files.length - 1)].name)?.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center'             

            })
            selection > 0 ? setSelection(selection -1) : setSelection(files.length - 1)
			} else if (e.key == "Enter") {
                console.log("reading a file")
				let entry = files[selection];
				setCurrentFile({ name: entry.name!, path: entry.path })
                setShowCommandWindow(false)
                setSearchString("")     
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
					/>
				</div>
				{searchString != "" ? (
					<div className="flex flex-col h-full justify-center hover-border-none transition-colors max-h-[50vh] hover:border-zinc-600 bg-slate-800  border-zinc-700">
						<div className="mr-5 text-right text-zinc-400">
							{files.length} results
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
				) : null}
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
                                       <div>{renderSearch()} </div>

                                    ) : (
                                    <div></div>
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

									) : (<></>
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
