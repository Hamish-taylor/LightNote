import { FileEntry } from "@tauri-apps/api/fs";
import { useState } from "react";
import { IoMdArrowDropdown } from "react-icons/io";

function FileTreeItem(props: any) {
	const [showChildren, setShowChildren] = useState(false);

	const isFileOrFolder = (path: string) => {
		const re = new RegExp("[.][a-z]*");
		if (path.endsWith(".md")) {
			return "file";
		} else if (re.test(path)) {
			return "none";
		}
		return "folder";
	};

	const cleanChildren = (entries: FileEntry[]) => {
		entries = entries.filter((entry) => !(entry.name?.charAt(0) === "."));
		return entries;
	};

	return (
		<div className="bg-transparent ">
			{isFileOrFolder(props.entry.path) == "none" ? (
				<div className="tooltip " data-tip="Invalid filetype">
					<button
						id={props.entry.path}
						className=" bg-transparent opacity-25 flex flex-1 text-left w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none "
					>
						<div id={props.entry.path + ":name"}>{props.entry.name}</div>
						{isFileOrFolder(props.entry.path) == "folder" ? (
							<IoMdArrowDropdown className="place-self-center" />
						) : null}
					</button>
				</div>
			) : (
				<div className="tooltip-open" data-tip="Invalid character">
				<button
					draggable={true} onDragEnd={() => console.log("wow")}
					onDragOver={() => console.log("gragging")}
					id={props.entry.path}
					type="button"
					onClick={() => {
						if (isFileOrFolder(props.entry.path) == "file") {
							props.changeSelected({
								name: props.entry.name,
								path: props.entry.path,
							});
						} else {
							setShowChildren(!showChildren);
						}
					}}
					
					className={
						props.selected
							? " bg-black flex flex-1 text-left w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none "
							: " bg-transparent flex flex-1 text-left w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none "
					}
				>
					
					<div id={props.entry.path} className={ props.renaming ? "bg-black border border-blue-500" : "bg-transparant"} contentEditable={props.renaming} >
						 {isFileOrFolder(props.entry.path) == "file" ? <> <label id={props.entry.path} className="float-left">{props.entry.name.split(".md")[0].trimEnd()}</label> <span id={props.entry.path}className="text-left">.md</span></> : <> <label id={props.entry.path} className="float-left">{props.entry.name.split(".md")[0].trimEnd()}</label> <span id={props.entry.path}className="text-left"></span></> }
					</div>
					{isFileOrFolder(props.entry.path) == "folder" ? (
						<IoMdArrowDropdown className="place-self-center" />
					) : null}
				</button>
				</div>
			)}
			<div
				style={showChildren ? { maxHeight: "5000px" } : { maxHeight: "0" }}
				className={
					showChildren
						? "  pl-5 bg-zinc-800 duration-800 ease-in transition-all overflow-hidden"
						: " pl-5 bg-zinc-800 duration-800  transition-all overflow-hidden"
				}
			>
				{props.entry.children && showChildren
					? cleanChildren(props.entry.children).map((e: any) => {
							return (
								<FileTreeItem
									entry={e}
									changeSelected={props.changeSelected}
									selected={props.selected}
								/>
							);
					  })
					: null}
			</div>
		</div>
	);
}

export default FileTreeItem;
