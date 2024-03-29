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
	renameFile,
} from "@tauri-apps/api/fs";

import { fs, invoke } from "@tauri-apps/api";

import Editor from "./Editor";
import SideBar from "./SideBar";

import FileTreeItem from "./FileTreeItem";
import { documentDir } from "@tauri-apps/api/path";
import Settings from "./Settings";
import SplashScreen from "./SplashScreen";

import SplitPane, { Pane } from "split-pane-react";
import "split-pane-react/esm/themes/default.css";
import { EditorState, Text, TransactionSpec } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import ContextMenus from "./ContextMenus";

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
	console.log(path)
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
	const [showFileLeaf, setShowFileLeaf] = useState(false);
	const [showInfoLeaf, setShowInfoLeaf] = useState(false);
	const [prevFileTreeWidth, setPrevFileTreeWidth] = useState<number>(300);
	const [fileTreeWidth, setFileTreeWidth] = useState<number>(300);
	const [currentFileContent, setCurrentFileContent] = useState("");
	//const [currentFilePath, setCurrentFilePath] = useState("");
	//const [currentFileName, setCurrentFileName] = useState("");
	const [wordCount, setWordCount] = useState(0);
	const [settingsModal, setSettingsModal] = useState(false);
	const [currentFile, setCurrentFile] = useState({ name: "", path: "" });

	const [sizes, setSizes] = useState([0, "fit", 0]);

	const [contextMenuSelectedNode, setContextMenuSelectedNode] = useState<HTMLElement | undefined>(undefined)


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
		loadSettings();
	}, []);

	useEffect(() => {
		if (settings.mainFolder.value !== "") {
			//console.log("reading files");
			//save settings
			saveSettings();
			readFiles();
			// loaded.current = true;

			//console.log("main folder: " + settings.mainFolder.value);
		} else {
			//console.log("no main folder");
			//loadSettings();
			//console.log("main folder: " + mainFolder);
		}
	}, [settings]);

	const saveSettings = async () => {
		const path = await documentDir();
		await writeTextFile(
			path + "/LightWay" + "/LightWay.json",
			JSON.stringify(settings)
		);
	};
	const countHeading = (text: string) => {
		let count = 0;
		let name = "";
		for (let i = 0; i < text.length; i++) {
			if (text[i] === "#") {
				count++;
			} else {
				name += text[i];
			}
		}
		name = name.trim();
		return { count, name };
	};

	const processFile = (text: string) => {
		const lines = text.split("\n");

		const process = (level: number, text: string[]) => {
			let children = {};
			let lines: string[] = [];
			//console.log(level)
			for (let i = 0; i < text.length; i++) {
				const line = text[i];
				if (line.trim().startsWith("#")) {
					const { count, name } = countHeading(line);
					if (count > level) console.log(count, name, level);
					if (count > level) {
						console.log("Passing to children " + text.slice(i + 1));
						const { remainder, data } = process(count, text.slice(i + 1));
						console.log(remainder, data);
						text = remainder;
						i = -1;
						children = {
							...children,
							[name]: data,
						};
					} else {
						console.log(lines, children);
						console.log("Remainder: " + text.slice(i));
						return {
							remainder: text.slice(i),
							data: { lines: lines, children: children },
						};
					}
				} else {
					console.log("Pushing" + line);
					lines.push(line);
				}
			}
			return { remainder: [], data: { lines: lines, children: children } };
		};

		console.log("processing file: " + text);
		const wow = process(0, lines);
		console.log('{"' + name + '" : ' + JSON.stringify(wow.data) + "}");
		return wow.data;
	};

	const generateHeadingDisplay = (curFile: string) => {
		const file = processFile(curFile);
		console.log(file);

		const heading = (
			child: { lines: string[]; children: { [key: string]: any } },
			level: string
		) => {
			let ret: ReactNode[] = [];
			let count = 1;

			Object.entries(child.children).forEach(([key]) => {
				console.log(key);

				if (level != "") {
					ret.push(
						<div className="flex flex-row">
							<div className="font-bold">{level + "." + count + " "}</div>{" "}
							<div className="ml-1"> {key} </div>
						</div>
					);

					ret.push(heading(child.children[key], level + "." + count));
				} else {
					ret.push(
						<div className="flex flex-row">
							<div className="font-bold">{count + " "}</div>{" "}
							<div className="ml-1"> {key} </div>
						</div>
					);

					ret.push(heading(child.children[key], count.toString()));
					ret.push(<div className="divider m-0" />);
				}

				count += 1;
			});
			return <div className="ml-5">{ret}</div>;
		};
		setFileHeadingDisplay(<div className="">{heading(file, "")}</div>);
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
			// const fileBrowserLeaf = document.getElementById("FileTreeItems")
			// //find its parent
			// if(fileBrowserLeaf?.contains(event.target)) {
			// 	if (isFileOrFolder(event.target.id) === "file") {
			// 		//setShowFileContext(true);

			// 		console.log("file")
			// 	} else if (isFileOrFolder(event.target.id) === "folder") {
			// 		setShowEditorContext(true);
			// 		console.log("folder")
			// 	} else {
			// 		setShowEditorContext(false);
			// 		setShowFileContext(false);
			// 	}
			// }	



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

	useEffect(() => {
		var parent = document.getElementById(renaming.current)!;

		if (parent) {
			var child = parent.children[0] as HTMLElement;
			var list = parent.parentElement!.parentElement!.parentElement!;
			console.log(list);

			list.scrollTop = parent.offsetTop - window.innerHeight / 2;

			var range = document.createRange();

			//range.selectNodeContents(child);
			var sel = window.getSelection()!;
			sel.removeAllRanges();

			range.setStart(child, 1)
			range.setEnd(child, 2)

			sel.addRange(range);

			const renameFile = async () => {
				const newName = child.innerText;
				//console.log("New Name: " + newName);
				//console.log("Old Name: " + renaming.current);

				if (newName != renaming.current) {
					const path = renaming.current.substring(
						0,
						renaming.current.lastIndexOf("\\")
					);
					//console.log("Path: " + path);

					if (
						!/^[ A-Za-z0-9.-]*$/.test(newName) &&
						!parent.parentElement!.classList.contains("tooltip")
					) {
						//parent.parentElement!.classList.add("tooltip");
						//console.log("Invalid character");
						renaming.current = "";
						await readFiles();
						return;
					} else if (parent.parentElement!.classList.contains("tooltip")) {
						//parent.parentElement!.classList.remove("tooltip");
					}
					await fs.renameFile(renaming.current, path + "/" + newName);
					if (currentFile.path == renaming.current) {
						openNewFile(path + "/" + newName, newName);
					}
					await readFiles();
				}

				renaming.current = "";
			};

			child.addEventListener(
				"keydown",
				(e) => {
					console.log(e.key)
					if (e.key == "Enter") {
						child.blur();
					}
				},
				{ once: true }
			);

			child.addEventListener(
				"blur",
				(e) => {
					renameFile();
					var sel = window.getSelection()!;
					sel.removeAllRanges();
				},
				{ once: true }
			);
		}
	}, [renaming.current]);


	const showFileBrowserLeaf = () => {
		let elements = document.getElementsByClassName("react-split__pane");

		for (let i = 0; i < elements.length; i++) {
			let elem = elements[i] as HTMLElement;
			elem.classList.add("transition-all");
			elem.addEventListener("transitionend", (e) => {
				elem.classList.remove("transition-all");
			});
			elem.onanimationend = () => {
				elem.classList.remove("transition-all");
			};
		}

		if (sizes[0] > 0) {
			let s: number = sizes[0] < 200 ? 200 : (sizes[0] as number);
			setPrevFileTreeWidth(s);
			setSizes([0, sizes[1], sizes[2]]);
			setShowFileLeaf(false);
		} else {
			setSizes([prevFileTreeWidth, sizes[1], sizes[2]]);
			setShowFileLeaf(true);
		}
	};

	const showFileInfoLeaf = () => {
		let elements = document.getElementsByClassName("react-split__pane");

		for (let i = 0; i < elements.length; i++) {
			let elem = elements[i] as HTMLElement;
			elem.classList.add("transition-all");
			elem.addEventListener("transitionend", (e) => {
				elem.classList.remove("transition-all");
			});
			elem.onanimationend = () => {
				elem.classList.remove("transition-all");
			};
		}

		if (sizes[2] > 0) {
			//setPrevFileTreeWidth(sizes[0] < 200 ? 200 : sizes[0]);
			setSizes([sizes[0], sizes[1], 0]);
			setShowInfoLeaf(false);
		} else {
			setSizes([sizes[0], sizes[1], 200]);
			setShowInfoLeaf(true);
		}
	};

	useEffect(() => {
		if (sizes[0] > 0) {
			setShowFileLeaf(true);
		} else {
			setShowFileLeaf(false);
		}
		if (sizes[2] > 0) {
			setShowInfoLeaf(true);
		} else {
			setShowInfoLeaf(false);
		}
	}, [sizes]);

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
		generateHeadingDisplay(file);
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
				//console.log("reading file");
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
			<div id="FileTreeItems">
				{entries.map((entry: any) => {
					return (
						<FileTreeItem
							entry={entry}
							selected={currentFile.path == entry.path}
							changeSelected={setCurrentFile}
							renaming={renaming.current == entry.path}
						/>
					);
				})}
			</div>
		);
	};

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
			generateHeadingDisplay(value);


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
				selection < files.length - 1 ? setSelection(selection + 1) : setSelection(0);
			} else if (e.key == "ArrowUp") {
				selection > 0 ? setSelection(selection - 1) : setSelection(files.length - 1);
			} else if (e.key == "Enter") {
				let entry = files[selection];
				setCurrentFile({ name: entry.name!, path: entry.path })
			}
		}, { once: true })


		return (
			<div className="flex flex-col ">
				<div className="text-center text-xl">Search for a note</div>
				<div className="input-group  justify-center p-5">
					<input
						type="text"
						onChange={(e) => setSearchString(e.target.value)}
						placeholder="Search…"
						className="input input-bordered outline-none border-none focus:outline-none focus:border-none"
					/>
					<button className="btn btn-square  outline-none border-none focus:outline-none focus:border-none">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
					</button>
				</div>
				{searchString != "" ? (
					<div className="flex flex-col  h-full overflow-auto border-x  transition-colors hover:border-zinc-600  border-zinc-700 p-5 w-[400px]">
						<div className="mr-5 text-right text-zinc-400">
							{files.length} results
						</div>
						<div className="flex flex-col  h-full overflow-auto transform-all duration-700">
							{
								files.map((entry: any, index) => {
									return (
										<div className="text-start">
											<div className="divider m-0" />
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
		);
	};

	return (
		<div>
			<div className="z-0 bg-zinc-900 flex flex-col w-screen h-screen overflow-hidden ">
				<ContextMenus deleteFile={deleteFile} renaming={renaming} anchorPoint={anchorPoint} selectedNode={contextMenuSelectedNode}></ContextMenus>
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
				{mainFolder !== undefined ? (
					mainFolder === "" ? (
						<SplashScreen loadSettings={loadSettings}></SplashScreen>
					) : (
						<div className="w-full h-full flex relative">
							<SideBar
								showFileBrowserLeaf={showFileBrowserLeaf}
								showFileLeaf={showFileLeaf}
								showSettingsModal={showSettingsModal}
							/>
							<SplitPane split="vertical" sizes={sizes} onChange={setSizes}>
								<Pane minSize={0} maxSize="50%" className="">
									{/* <ResizableBox className="flex flex-row justify-end h-full"  handle={<div  className=" h-full w-1 hover:cursor-col-resize hover:bg-blue-500 self-end " />} width={200} height={1000} draggableOpts={{}} minConstraints={[100, 100]} maxConstraints={[8000, 800]}> */}
									<div
										className="z-0 relative h-full flex flex-col overflow-hidden"
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
									{/* </ResizableBox> */}
								</Pane>
								<div
									id="contentPane"
									className="bg-zinc-700 w-full h-full flex-1 flex-grow overflow-auto place-items-center "
								>

									{currentFile.path != "" ? (

										<TestHarness>

											<Editor
												onCreateEditor={onCreateEditor}
												onChange={onChange}
												currentFileContent={currentFileContent}
												currentFilePath={currentFile.path}
												className=" focus:outline-solid text-white"
												settings={settings}
											/>
											{/* <div ref={editor1} /> */}

										</TestHarness>

									) : (
										<div className="flex w-full  h-full flex-col overflow-hidden">
											<div
												className={
													searchString != ""
														? "form-control self-center  pt-40  transition-all duration-[500ms] overflow-hidden ease-in-out"
														: "form-control self-center  pt-[40vh]   transition-all duration-[500ms] ease-in-out overflow-hidden"
												}
											></div>
											<div
												className={
													"flex  self-center h-[80%] transition-all  relative"
												}
											>
												{renderSearch()}
											</div>
										</div>
									)}
									<div></div>
								</div>

								<Pane minSize={0} maxSize="50%">
									<div
										id="rightInfoLeaf"
										className="z-0 relative h-full w-full bg-zinc-800 flex-col overflow-hidden transition-all"
									>
										<div className="collapse collapse-arrow">
											<input type="checkbox" className="peer" />
											<div className="collapse-title  text-primary-content ">
												Headings
											</div>
											<div className="collapse-content  ">
												<div className="overflow-auto">
													{fileHeadingDisplay ? (
														fileHeadingDisplay
													) : (
														<div>Open a file to view its Headings</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</Pane>
							</SplitPane>
							<SideBar
								showFileBrowserLeaf={showFileInfoLeaf}
								showFileLeaf={showInfoLeaf}
								showSettingsModal={showSettingsModal}
							/>
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
