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

	return (
		<div className="bg-zinc-800 ">
			{isFileOrFolder(props.entry.path) == "none" ? (
				<div className="tooltip " data-tip="Invalid filetype">
					<button
						id={props.entry.path}
						className=" bg-zinc-800 opacity-25 flex flex-1 text-left w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none "
					>
						<div id={props.entry.path + ":name"}>{props.entry.name}</div>
						{isFileOrFolder(props.entry.path) == "folder" ? (
							<IoMdArrowDropdown className="place-self-center" />
						) : null}
					</button>
				</div>
			) : (
				<button
					id={props.entry.path}
					onClick={() => {
						props.changeSelected(props.entry.path, props.entry.name);
						setShowChildren(!showChildren);
					}}
					contentEditable={props.renaming}
					onBlur={(e) => {}}
					className={
						props.renaming == true
							? "renaming select-all bg-zinc-800 flex flex-1 text-left w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none "
							: " bg-zinc-800 flex flex-1 text-left w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none "
					}
				>
					<div
						id={props.entry.path}
						className={
							props.renaming == true
								? "select-all border-blue-600 border-1 outline-2 outline-blue-600 outline-dotted bg-zinc-700"
								: " "
						}
					>
						{props.entry.name}
					</div>
					{isFileOrFolder(props.entry.path) == "folder" ? (
						<IoMdArrowDropdown className="place-self-center" />
					) : null}
				</button>
			)}
			<div
				style={showChildren ? { display: "block" } : { display: "none" }}
				className="pl-5 bg-zinc-800 duration-200 ease-in-out "
			>
				{props.entry.children
					? props.entry.children.map((e: any) => {
							return (
								<FileTreeItem entry={e} changeSelected={props.changeSelected} />
							);
					  })
					: null}
			</div>
		</div>
	);
}

export default FileTreeItem;
