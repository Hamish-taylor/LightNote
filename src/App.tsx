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
	MdOutlineInsertDriveFile,
	MdOutlineCreateNewFolder,
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
import SideBar from "./SideBar";

import FileTreeItem from "./FileTreeItem";
import SplashScreen from "./SplashScreen";
import { documentDir } from "@tauri-apps/api/path";
import Settings from "./Settings";

function TestHarness({ children }: { children?: React.ReactNode }) {
	const [id, forceUpdate] = useReducer((x) => x + 1, 0);

	document.addEventListener("file-read", () => {
		forceUpdate();
		// setChangeFile(false);
		console.log("forceupdatee");
	});

	// useEffect(() => {
	// 	console.log('forceupdate');
	// 	forceUpdate();
	// 	changeFile = false;
	// }, [changeFile])

	return (
		<>
			<Fragment key={id}>{children}</Fragment>
		</>
	);
}

//TODO:
function App() {
	//const [mainFolder, setMainFolder] = useState<folder>(new folder({ name: "Main", path: "C:/Users/Hamis/Documents/NotesCopy" }))
	const [allPaths, setAllPaths] = useState<FileEntry[]>([]);
	const [showFileLeaf, setShowFileLeaf] = useState(false);
	const [folderLeafWidth, setFolderLeafWidth] = useState(300);
	const [currentFileContent, setCurrentFileContent] = useState("");
	//const [currentFilePath, setCurrentFilePath] = useState("");
	//const [currentFileName, setCurrentFileName] = useState("");
	const [wordCount, setWordCount] = useState(0);
	const [settingsModal, setSettingsModal] = useState(false);
	const [currentFile, setCurrentFile] = useState({ name: "", path: "" });
	// const [settings, setSettings] = useState({
	// 	editorWidth: 700,
	// 	mainFolder: "",
	// });

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

	let loaded = useRef(true);

	const [renaming, setRenaming] = useState("");

	//Setting the window to frameless
	appWindow.setDecorations(false);

	const minimize = () => appWindow.minimize();
	const maximize = () => appWindow.toggleMaximize();
	const close = () => appWindow.close();

	const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
	const [showEditorContext, setShowEditorContext] = useState(false);
	const [showFileContext, setShowFileContext] = useState(false);
	const [contextID, setContextID] = useState("");

	const [changeFile, setChangeFile] = useState(false);

	// let changeFile = useRef(false);
	//const [id, forceUpdate] = useReducer((x) => x + 1, 0);

	useEffect(() => {
		loadSettings();
	}, []);

	useEffect(() => {
		readFiles();
		console.log("read files");
	}, [settings.mainFolder.value]);

	useEffect(() => {
		if (settings.mainFolder.value !== "") {
			console.log("reading files");
			//save settings
			saveSettings();
			readFiles();
			// loaded.current = true;
		} else {
			console.log("no main folder");
			loaded.current = false;
		}
	}, [settings.mainFolder.value]);

	useEffect(() => {
		if (allPaths.length > 0) {
			loaded.current = true;
		}
	}, [allPaths]);
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
			setSettings(JSON.parse(set));
		} catch (error) {
			files = await createDir(path + "/LightWay", { recursive: true });
			await writeTextFile(
				path + "/LightWay" + "/LightWay.json",
				JSON.stringify(settings)
			);
		}
		console.log(files);
	};

	const createNewFile = async () => {
		let num = 0;
		let loop = true;
		let newFileName = "Untitled.md";

		while (loop) {
			try {
				await readTextFile(settings.mainFolder.value + "/" + newFileName);
				num += 1;
				newFileName = "Untitled " + num + ".md";
			} catch (error) {
				await writeTextFile(settings.mainFolder.value + "/" + newFileName, "");
				loop = false;
			}
		}

		await readFiles();
		setCurrentFile({ name: newFileName, path: settings.mainFolder.value });
		openNewFile(settings.mainFolder.value + "/" + newFileName, newFileName);
	};

	const createNewFolder = async () => {
		let num = 0;
		let loop = true;

		let newFolderName = settings.mainFolder.value + "/" + "Untitled";

		while (loop) {
			try {
				await createDir(newFolderName);
				loop = false;
			} catch (error) {
				num += 1;
				newFolderName = settings.mainFolder.value + "/" + "Untitled " + num;
			}
		}

		await readFiles();
		setContextID(newFolderName);
		setRenaming(newFolderName);
	};

	const handleContextMenu = useCallback(
		(event: {
			preventDefault: () => void;
			pageX: any;
			pageY: any;
			target: { id: any };
		}) => {
			event.preventDefault();
			setAnchorPoint({ x: event.pageX, y: event.pageY });
			if (showEditorContext || showFileContext) {
				setShowEditorContext(false);
				setShowFileContext(false);
			}
			if (isFileOrFolder(event.target.id) == "file") {
				setShowFileContext(true);
			} else if (isFileOrFolder(event.target.id) == "folder") {
				setShowEditorContext(true);
			} else {
				setShowEditorContext(false);
				setShowFileContext(false);
			}
			setContextID(event.target.id);
		},
		[setAnchorPoint]
	);

	const handleContextClick = useCallback(
		() =>
			showEditorContext || showFileContext
				? (setShowEditorContext(false), setShowFileContext(false))
				: null,
		[showEditorContext, showFileContext]
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

	useEffect(() => {
		var el = document.getElementById(renaming)!;
		if (el) {
			var range = document.createRange();
			range.selectNodeContents(el);
			var sel = window.getSelection()!;
			sel.removeAllRanges();
			sel.addRange(range);

			document.addEventListener("keydown", (e) => {
				if (e.key == "Enter") {
					setRenaming("");
				}
			});

			el.addEventListener("blur", (e) => setRenaming(""));
		}
	}, [renaming]);

	const isFileOrFolder = (path: string) => {
		const re = new RegExp("[.][a-z]*");
		if (path.endsWith(".md")) {
			return "file";
		} else if (re.test(path)) {
			return "none";
		}
		return "folder";
	};
	const showFileBrowserLeaf = () => {
		setShowFileLeaf(!showFileLeaf);
	};

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
		console.log(path);
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
			const elem = document.getElementById(currentFile.path)!;
			if (elem) {
				console.log("reading file");
				readFile(currentFile.path);
			}
		}
	}, [currentFile]);

	const renderFolders = (entries: any[]) => {
		entries = entries.filter((entry) => !(entry.name?.charAt(0) === "."));
		entries.sort((a, b) => {
			if (a.children && !b.children) {
				return -1;
			}
			if (!a.children && b.children) {
				return 1;
			}

			return a.name!.localeCompare(b.name!);
		});
		return (
			<div>
				{entries.map((entry: any) => {
					return (
						<FileTreeItem
							entry={entry}
							selected={currentFile.path}
							changeSelected={setCurrentFile}
							renaming={renaming == entry.path}
						/>
					);
				})}
			</div>
		);
	};

	// const files = useMemo(() => renderFolders(allPaths), [allPaths]);
	useEffect(() => {
		// Query the element
		const resizer = document.getElementById("resizeBar")!;
		const leftSide = document.getElementById("FileBrowserLeaf")!;
		const rightSide = document.getElementById("contentPane")!;
		if (resizer && leftSide && rightSide) {
			// The current position of mouse
			let x = 0;
			let y = 0;

			// Width of left side
			let leftWidth = 0;

			// Handle the mousedown event
			// that's triggered when user drags the resizer
			const mouseDownHandler = function (e: {
				clientX: number;
				clientY: number;
			}) {
				leftSide.classList.remove("transition-all");
				// Get the current mouse position
				x = e.clientX;
				y = e.clientY;
				leftWidth = parseInt(getComputedStyle(leftSide, "").width); //leftSide.getBoundingClientRect().width;

				// Attach the listeners to `document`
				document.addEventListener("mousemove", mouseMoveHandler);
				document.addEventListener("mouseup", mouseUpHandler);
			};

			// Attach the handler
			resizer.addEventListener("mousedown", mouseDownHandler);

			const mouseMoveHandler = function (e: {
				clientX: number;
				clientY: number;
			}) {
				// How far the mouse has been moved
				const dx = e.clientX - x;

				let newLeftWidth =
					((leftWidth + dx) * 100) /
					resizer.parentElement!.getBoundingClientRect().width;
				if (newLeftWidth < 4) {
					newLeftWidth = 0;
				}

				if (newLeftWidth > 4) {
					setShowFileLeaf(true);
				} else {
					setShowFileLeaf(false);
				}

				leftSide.style.width = `${newLeftWidth}%`;

				document.body.style.cursor = "col-resize";
				document.body.style.cursor = "col-resize";

				leftSide.style.userSelect = "none";
				leftSide.style.pointerEvents = "none";

				rightSide.style.userSelect = "none";
				rightSide.style.pointerEvents = "none";
			};

			const mouseUpHandler = function () {
				leftSide.classList.add("transition-all");
				resizer.style.removeProperty("cursor");
				document.body.style.removeProperty("cursor");

				leftSide.style.removeProperty("user-select");
				leftSide.style.removeProperty("pointer-events");

				rightSide.style.removeProperty("user-select");
				rightSide.style.removeProperty("pointer-events");

				// Remove the handlers of `mousemove` and `mouseup`
				document.removeEventListener("mousemove", mouseMoveHandler);
				document.removeEventListener("mouseup", mouseUpHandler);

				leftWidth = parseInt(getComputedStyle(leftSide, "").width);
				if (leftWidth < 4) {
					setShowFileLeaf(false);
					setFolderLeafWidth(300);
				} else {
					setFolderLeafWidth(leftWidth);
					setShowFileLeaf(true);
				}
				if (leftWidth > 4 && showFileLeaf == false) {
					setShowFileLeaf(true);
				}
			};
		}
	}, [allPaths]);

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
		async (value: any, viewUpdate: any) => {
			//save the file
			countWords(value);
			await writeTextFile(currentFile.path, value);
		},
		[currentFile.path]
	);

	return (
		<div>
			<div className="z-0 bg-zinc-900 flex flex-col w-screen h-screen overflow-hidden ">
				{showEditorContext ? (
					<ul
						className="menu w-auto h-auto absolute z-50 bg-zinc-900 flex flex-col justify-between border-zinc-800 rounded-md"
						style={{
							top: anchorPoint.y,
							left: anchorPoint.x,
						}}
					>
						<button
							className="flex text-center align-middle text-sm rounded-none border-none bg-transparent hover:bg-zinc-700 mt-1"
							onClick={() => {
								setRenaming(contextID); //, rename();
							}}
						>
							<VscEdit className="text-s self-center mr-1" />
							Rename folder
						</button>
						<button
							className="flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700 mb-1"
							onClick={() => {
								deleteFile(contextID);
							}}
						>
							<VscTrash className="text-s self-center  mr-1" />
							Delete folder
						</button>
					</ul>
				) : (
					<> </>
				)}

				{showFileContext ? (
					<ul
						className="menu w-auto h-auto absolute z-50 bg-zinc-900 flex flex-col justify-between"
						style={{
							top: anchorPoint.y,
							left: anchorPoint.x,
						}}
					>
						<button
							className="flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700 mt-1"
							onClick={() => {
								setRenaming(contextID); //, rename();
							}}
						>
							<VscEdit className="text-s self-center mr-1" />
							Rename file
						</button>
						<button
							className="flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700  mb-1"
							onClick={() => {
								deleteFile(contextID);
							}}
						>
							<VscTrash className="text-s self-center  mr-1" />
							Delete file
						</button>
					</ul>
				) : (
					<> </>
				)}

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
				{settingsModal ? (
					<Settings
						showSettingsModal={showSettingsModal}
						settings={settings}
						setSettings={setSettings}
					/>
				) : null}
				{settings.mainFolder.value == "" && !loaded.current ? (
					<SplashScreen
						setSettings={setSettings}
						settings={settings}
						readFiles={readFiles}
					></SplashScreen>
				) : (
					<div className="z-0 flex flex-row h-full overflow-hidden">
						<SideBar
							showFileBrowserLeaf={showFileBrowserLeaf}
							showFileLeaf={showFileLeaf}
							showSettingsModal={showSettingsModal}
						/>
						<div
							style={
								showFileLeaf
									? { width: folderLeafWidth + "px" }
									: { width: "0px" }
							}
							className="z-0 relative h-full flex max-w-[80%] flex-col overflow-hidden transition-all"
							id="FileBrowserLeaf"
						>
							<div className="rounded-tl-lg w-full justify-center flex bg-zinc-800 p-3">
								<button
									type="button"
									onClick={createNewFile}
									className="px-4 py-1 text-2xl  bg-zinc-800 text-zinc-500 font-semibold rounded-none border-none hover:text-white   focus:outline-none "
								>
									<MdOutlineInsertDriveFile />
								</button>
								<button
									type="button"
									onClick={createNewFolder}
									className="px-4 py-1 text-2xl bg-zinc-800 text-zinc-500 font-semibold rounded-none border-none hover:text-white   focus:outline-none "
								>
									<MdOutlineCreateNewFolder />
								</button>
							</div>
							<div
								id="folderTree"
								className={
									"bg-zinc-800 w-full h-full overflow-auto pb-10 text-sm text-ellipsis "
								}
							>
								{renderFolders(allPaths)}
							</div>
						</div>
						<div
							id="resizeBar"
							className={
								showFileLeaf
									? "w-1 bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50"
									: " rounded-tl-2xl w-1 bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50"
							}
						></div>
						<div
							id="contentPane"
							className="bg-zinc-700 w-full h-full overflow-auto flex-1 place-items-center "
						>
							<TestHarness>
								<Editor
									onChange={onChange}
									currentFileContent={currentFileContent}
									currentFilePath={currentFile.path}
									className=" focus:outline-solid"
									settings={settings}
								/>
								{/* <div ref={editor1} /> */}
							</TestHarness>
						</div>
					</div>
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
