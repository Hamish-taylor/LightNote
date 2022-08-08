import { useState } from "react";
import { AiFillFire } from "react-icons/ai";
import { open } from "@tauri-apps/api/dialog";
import { VscArrowSmallLeft } from "react-icons/vsc";
import { documentDir } from "@tauri-apps/api/path";
import { createDir, readDir, readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import "./App.css";
import { fs } from "@tauri-apps/api";

function SplashScreen(props : any) {
	const [slideSplashScreen, setSlideSplashScreen] = useState(false);
	const [selectedFolder, setSelectedFolder] = useState("");
	const [selectedFolderForCreate, setSelectedFolderForCreate] = useState("");
	
	const [initialSettings, setInitialSettings] = useState({
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
	
	
	const openFolder = async () => {
		const selected = await open({
			multiple: true,
			directory: true,
		});
		if (selected) {
			const path = selected[0];
			console.log(path);
			if (slideSplashScreen) {
				setSelectedFolderForCreate(path);
			} else {
				setSelectedFolder(path);
			}
			// const set = settings;
			// set.mainFolder = path;
			// setSettings(set);
			// await readFiles();
		}
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
			setInitialSettings(JSON.parse(set));
		} catch (error) {
			files = await createDir(path + "/LightWay", { recursive: true });
			await writeTextFile(
			    path + "/LightWay" + "/LightWay.json",
			    JSON.stringify(initialSettings)
			);
		}
	};

	

	const saveSettings = async () => {
		const path = await documentDir();
		await writeTextFile(
			path + "/LightWay" + "/LightWay.json",
			JSON.stringify(initialSettings)
		);
		props.loadSettings();
	}

	const setMainFolder = async () => {
		const set = initialSettings;
		set.mainFolder.value = selectedFolder;
		setInitialSettings(set);
		saveSettings();
	};

	const createMainFolder = async () => {
		const folderName = (
			document.getElementById("splashScreenFolderName")! as HTMLInputElement
		).value;
		const path = selectedFolderForCreate;
		await fs.createDir(path + "/" + folderName);
		const set = initialSettings;
		set.mainFolder.value = path + "/" + folderName;
		setInitialSettings(set);
		saveSettings();
	};
	return (
		<div
			id="splashscreen"
			className=" h-screen w-full bg-zinc-600 text-center flex-col flex"
		>
			<div className="pb-5 pt-10 text-8xl flex ">
				<svg width="0" height="0">
					<defs>
						<linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
							<stop
								offset="0%"
								style={{
									stopColor: "#b794f4",
									stopOpacity: "stop-opacity:1",
								}}
							/>
							<stop
								offset="50%"
								style={{
									stopColor: "#ed64a6",
									stopOpacity: "stop-opacity:1",
								}}
							/>
							<stop
								offset="100%"
								style={{
									stopColor: "#f56565",
									stopOpacity: "stop-opacity:1",
								}}
							/>
						</linearGradient>
					</defs>
				</svg>
				<AiFillFire className="flex-1 " style={{ fill: "url(#grad1)" }} />
			</div>
			<div className=" text-5xl">Welcome to LightNote!</div>
			<div className=" text-sm text-zinc-400">Alpha 0.0.1</div>
			<div className="relative ml-auto mr-auto mt-auto top-0 bottom-0 mb-auto left-0 right-0 w-[500px] border-2 border-zinc-500 rounded-lg overflow-hidden ">
				<div className="carousel w-full space-x-20  p-10">
					<div id="item1" className="carousel-item w-full p-10">
						<div
						//onAnimationEnd={() => setSlideSplashScreen(false)}
						//className={slideSplashScreen ? "slidein " : ""}
						>
							<form className="flex felx-row justify-between items-center ">
								<div className="text-left">
									<div className="flex-1">Choose a home for your notes</div>
									<div className="flex-1 text-gray-400">
										Create a folder to store your notes
									</div>
								</div>
								<div className="float-right">
									<a
										onClick={() => {
											setSlideSplashScreen(true);
										}}
										href="#item2"
										className="hover:border-blue-400 border-transparent btn bg-zinc-700 outline-none  text-white btn-sm w-[80px] h-[50px]"
									>
										Create
									</a>
									{/* <button
												type="button"
												className="bg-zinc-700 outline-none hover:border-blue-400  focus:border-none focus:outline-none"
												onClick={() => {
													setSlideSplashScreen(true);
												}}
											>
												Create
											</button> */}
								</div>
							</form>
							<div className="divider justify-center"></div>
							<form className="flex  justify-between items-center space-x-6 max-w-1">
								<div className="text-left ">
									<div className="flex-1">Open notes folder</div>

									<div className="text-gray-400  ">
										{selectedFolder === ""
											? "Open an existing notes folder"
											: "Opening folder:"}
										<div
											className="tooltip"
											data-tip={selectedFolder === "" ? "" : selectedFolder}
										>
											<div className="text-blue-400 font-bold truncate w-[300px] ">
												{selectedFolder === "" ? "" : selectedFolder}
											</div>
										</div>
									</div>
								</div>
								<div className="float-right">
									<a
										onClick={openFolder}
										className=" hover:border-blue-400 border-transparent btn bg-zinc-700 outline-none  text-white btn-sm w-[80px] h-[50px]"
									>
										Open
									</a>
									{/* <button
												type="button"
												className="bg-zinc-700 outline-none hover:border-blue-400  focus:border-none focus:outline-none"
												onClick={openFolder}
											>
												Open
											</button> */}
								</div>
							</form>

							<div className="divider justify-center "></div>
						</div>
					</div>
					<div id="item2" className="carousel-item w-full p-10 relative">
						<div>
							<a
								href="#item1"
								onClick={() => setSlideSplashScreen(false)}
								className=" absolute left-6 top-[-20px] text-2xl  btn bg-transparent hover:text-black hover:bg-transparent outline-none border-none float-left text-white btn-sm h-[50px]"
							>
								<VscArrowSmallLeft />
							</a>
							{/* <a
										href="#item1"
										className="float-left bg-blue-400"
										// onClick={() => setSlideSplashScreen(false)}
									/> */}

							<form className="flex felx-row justify-between items-center space-x-6">
								<div className="text-left">
									<div className="flex-1">Notes folder name</div>
									<div className="flex-1 text-gray-400">
										Name you notes folder
									</div>
								</div>
								<div className="">
									<input
										placeholder="Folder name"
										id="splashScreenFolderName"
										onKeyDown={(e) => {
											e.key === "Enter" ? e.preventDefault() : null;
										}}
										className="text-white w-4/5 float-right bg-zinc-700 border-1 focus:outline-none focus:border-none "
									></input>
								</div>
							</form>
							<div className="divider justify-center"></div>
							<form className="flex felx-row justify-between items-center space-x-6">
								<div className="text-left">
									<div className="flex-1">Choose folder</div>
									<div className="text-gray-400  ">
										{selectedFolderForCreate === ""
											? "Choose the home for your new notes folder"
											: "Creating your notes folder in:"}
										<div
											className="tooltip"
											data-tip={
												selectedFolderForCreate === ""
													? ""
													: selectedFolderForCreate
											}
										>
											<div className="text-blue-400 font-bold truncate w-[300px] ">
												{selectedFolderForCreate === ""
													? ""
													: selectedFolderForCreate}
											</div>
										</div>
									</div>
								</div>
								<div className="float-right">
									<a
										onClick={openFolder}
										className="btn bg-zinc-700 hover:border-blue-400 border-transparent outline-none text-white btn-sm h-[50px] w-[80px]"
									>
										Open
									</a>
									{/* <button
												type="button"
												className="bg-zinc-700 outline-none hover:border-blue-400  focus:border-none focus:outline-none"
												onClick={openFolder}
											>
												Open
											</button> */}
								</div>
							</form>

							<div className="divider justify-center "></div>
						</div>
					</div>
				</div>
				{selectedFolder === "" && !slideSplashScreen ? (
					<div className="absolute bottom-10 ml-auto mr-auto mt-auto  mb-auto left-0 right-0">
						<div className="tooltip" data-tip="Missing information">
							<button
								disabled={true}
								className="  bg-blue-400  duration-300 hover:bg-red-500 outline-none focus:border-none focus:outline-none focus:bg-red-500 border-none w-[80px] h-[40px]"
								onClick={slideSplashScreen ? createMainFolder : setMainFolder}
							>
								Accept
							</button>
						</div>
					</div>
				) : selectedFolderForCreate === "" && slideSplashScreen ? (
					<div className="absolute bottom-10 ml-auto mr-auto mt-auto  mb-auto left-0 right-0">
						<div className="tooltip" data-tip="Missing information">
							<button
								disabled={true}
								className="  bg-blue-400  duration-300 hover:bg-red-500 outline-none focus:border-none focus:outline-none focus:bg-red-500 border-none w-[80px] h-[40px]"
								onClick={slideSplashScreen ? createMainFolder : setMainFolder}
							>
								Accept
							</button>
						</div>
					</div>
				) : (
					<div className="absolute bottom-10 ml-auto mr-auto mt-auto  mb-auto left-0 right-0">
						<button
							className="   bg-blue-400  duration-300 hover:animate-wiggle hover:w-[200px] outline-none focus:border-none focus:outline-none focus:bg-blue-500 border-none w-[80px] h-[40px]"
							onClick={slideSplashScreen ? createMainFolder : setMainFolder}
						>
							Accept
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default SplashScreen;
