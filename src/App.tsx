import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import { appWindow } from "@tauri-apps/api/window";
import { AiFillFire } from "react-icons/ai";
import {
	MdClear,
	MdMinimize,
	MdReadMore,
	MdKeyboardArrowLeft,
	MdMenuOpen,
	MdMenu,
	MdFolderOpen,
	MdOutlineInsertDriveFile,
	MdOutlineCreateNewFolder,
} from "react-icons/md";
import { IoMdArrowDropright, IoMdArrowDropdown } from "react-icons/io";
import {
	VscChromeMaximize,
	VscGear,
	VscEdit,
	VscTrash,
	VscArrowSmallLeft,
} from "react-icons/vsc";
import {
	readDir,
	BaseDirectory,
	FileEntry,
	readTextFile,
	writeTextFile,
	renameFile,
	createDir,
	removeDir,
	removeFile,
} from "@tauri-apps/api/fs";

import { fs, invoke } from "@tauri-apps/api";

import Editor from "./Editor";
import SideBar from "./SideBar";
import FileTree from "./FileTree";
import FileTreeItem from "./FileTreeItem";
import SplashScreen from "./SplashScreen";
import { documentDir } from "@tauri-apps/api/path";

//TODO:
function App() {
	//const [mainFolder, setMainFolder] = useState<folder>(new folder({ name: "Main", path: "C:/Users/Hamis/Documents/NotesCopy" }))
	const [allPaths, setAllPaths] = useState<FileEntry[]>([]);
	const [showFileLeaf, setShowFileLeaf] = useState(false);
	const [folderLeafWidth, setFolderLeafWidth] = useState(300);
	const [currentFileContent, setCurrentFileContent] = useState("");
	const [currentFilePath, setCurrentFilePath] = useState("");
	const [currentFileName, setCurrentFileName] = useState("");
	const [wordCount, setWordCount] = useState(0);
	const [settingsModal, setSettingsModal] = useState(false);
	const [settings, setSettings] = useState({
		editorWidth: 700,
		mainFolder: "",
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

	useEffect(() => {
		loadSettings();
	}, []);

	useEffect(() => {
		if (settings.mainFolder !== "") {
			console.log("reading files");
			//save settings
			saveSettings();
			readFiles();
			// loaded.current = true;
		}else {
			console.log("no main folder");
			loaded.current = false;
		}
	}, [settings.mainFolder]);

	useEffect(() => {
		if(allPaths.length > 0) {
		loaded.current = true;
		}
	}, [allPaths])
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
				await readTextFile(settings.mainFolder + "/" + newFileName);
				num += 1;
				newFileName = "Untitled " + num + ".md";
			} catch (error) {
				await writeTextFile(settings.mainFolder + "/" + newFileName, "");
				loop = false;
			}
		}

		await readFiles();
		await setCurrentFilePath(settings.mainFolder + "/" + newFileName);
		openNewFile(settings.mainFolder + "/" + newFileName, newFileName);
	};

	const createNewFolder = async () => {
		let num = 0;
		let loop = true;

		let newFolderName = settings.mainFolder + "/" + "Untitled";

		while (loop) {
			try {
				await createDir(newFolderName);
				loop = false;
			} catch (error) {
				num += 1;
				newFolderName = settings.mainFolder + "/" + "Untitled " + num;
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

	// useEffect(() => {
	// 	const elem = document.getElementById("FileBrowserLeaf")!;
	// 	if (elem) {
	// 		elem.classList.add("transition-all");
	// 		elem.addEventListener(
	// 			"transitionend",
	// 			function (event) {
	// 				elem.classList.remove("transition-all");
	// 			},
	// 			false
	// 		);
	// 	}
	// }, [showFileLeaf]);

	const openNewFile = (path: string, name: string) => {
		if (name.includes(".md")) {
			setCurrentFilePath(path);
			setCurrentFileName(name);
		}
	};

	const readFiles = async () => {
		if (settings.mainFolder != "") {
			const entries = await readDir(settings.mainFolder, { recursive: true });
			setAllPaths(entries);
		}
	};

	const readFile = async (path: string) => {
		const file = await readTextFile(path);
		setCurrentFileContent(file);
	};

	const countWords = (str: string) => {
		var count = 0;
		str.split(/\s+/).forEach((str) => {
			str.length > 0 ? count++ : null;
		});
		setWordCount(count);
	};

	const changeSelected = (path: string, name: string) => {
		if (path != "" && path.includes(".md")) {
			const elem = document.getElementById(path)!;
			if (elem) {
				document.getElementById(path)!.classList.add("active");
				readFile(path);
			}
			setCurrentFilePath(path);
			setCurrentFileName(name);
		}
		if (currentFilePath != "" && currentFilePath.includes(".md")) {
			console.log("removing");
			document.getElementById(currentFilePath)!.classList.remove("active");
		}
	};

	const renderFolders = (entries: any[]) => {
		entries = entries.filter((entry) => !(entry.name?.charAt(0) === "."));
		console.log(entries);
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
							selected={currentFilePath}
							changeSelected={changeSelected}
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
		if (currentFilePath == p) {
			changeSelected("", "");
			setCurrentFilePath("");
			setCurrentFileName("");
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
			await writeTextFile(currentFilePath, value);
		},
		[currentFilePath]
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
						{currentFileName}
					</span>
					<button
						onClick={minimize}
						className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none bg-center z-20"
					>
						{" "}
						<MdMinimize className="flex-1" />{" "}
					</button>
					<button
						onClick={maximize}
						className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none z-20"
					>
						{" "}
						<VscChromeMaximize />{" "}
					</button>
					<button
						onClick={close}
						className="bg-zinc-900 hover:bg-red-600 rounded-none border-none focus:outline-none z-20"
					>
						{" "}
						<MdClear />{" "}
					</button>
				</div>
				{settingsModal ? (
					<div className="z-20 top-0 left-0  w-screen h-screen  absolute flex place-content-center">
						<div
							onClick={showSettingsModal}
							className="absolute z-40  bg-black opacity-50 w-full h-full"
						></div>
						<div className=" z-50 opacity-100 relative  ml-auto mr-auto mt-auto top-0 bottom-0 mb-auto  left-0 right-0  w-4/5 h-4/5 bg-zinc-800  rounded-xl border-zinc-900 shadow-lg">
							<div className="justify-center">SETTINGS</div>
							<button
								onClick={showSettingsModal}
								className="absolute right-0 top-0 text-zinc-400 hover:text-zinc-100 bg-transparent rounded-none border-none focus:outline-none z-20"
							>
								{" "}
								<MdClear />{" "}
							</button>
							<br />
							{/* <div className="grid grid-rows-3 grid-flow-col gap-4 text-center ">
              <div className="row-span-3 bg-gray-900 ">01</div>
              <div className="col-span-2 bg-gray-900 ">02</div>
              <div className="row-span-2 col-span-2 bg-gray-900 ">03</div>
            </div> */}
							<div className="divider"></div>
							<div className="flex flex-row w-full  px-10">
								<div className=" flex-1 flex flex-col items-start">
									<label className="flex-1">Editor Width </label>
									<label className="flex-1 text-gray-400">
										The width of the editor in pixels
									</label>
								</div>
								<div className="text-end float flex-1 flex flex-col items-end">
									<input
										className="w-1/2"
										type="number"
										value={settings.editorWidth}
										onChange={(e) => {
											setSettings({
												...settings,
												editorWidth: parseInt(e.target.value),
											}),
												(document.getElementById("codeMirror")!.style.maxWidth =
													e.target.value + "px");
										}}
									/>
									<input
										className="range range-primary w-1/2 "
										type="range"
										min="100"
										max="2000"
										value={settings.editorWidth}
										onChange={(e) => {
											setSettings({
												...settings,
												editorWidth: parseInt(e.target.value),
											}),
												(document.getElementById("codeMirror")!.style.maxWidth =
													e.target.value + "px");
										}}
									/>
								</div>
								<div className="pl-2">px</div>
							</div>
							<div className="divider"></div>
						</div>
					</div>
				) : null}
				{settings.mainFolder == "" && !loaded.current ? (
					<SplashScreen
						setSettings={setSettings}
						settings={settings}
						readFiles={readFiles}
					></SplashScreen>
				) : (
					<div className="z-0 flex flex-row h-full overflow-hidden">
						{/* <div className="justify-between flex flex-col z-10 h-full bg-zinc-900">
          <button id="fileBrowser" onClick={showFileBrowserLeaf} className="text-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200"> {showFileLeaf ? <MdMenuOpen /> : <MdMenu />} </button>
          <button id="fileBrowser" onClick={showSettingsModal} className='text-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200'> {showFileLeaf ? <VscGear /> : <VscGear />} </button>
        </div> */}
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
							<Editor
								onChange={onChange}
								currentFileContent={currentFileContent}
							/>
						</div>
					</div>
				)}
				{settings.mainFolder !== "" ? (
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
