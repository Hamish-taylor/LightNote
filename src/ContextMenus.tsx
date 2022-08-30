import { useEffect } from "react";
import { VscEdit, VscTrash } from "react-icons/vsc";
import { isFileOrFolder } from "./App"

function ContextMenus(props: any) {

    useEffect(() => {
        if (props.selectedNode)
            console.log(props.selectedNode.id)
    }, [props.selectedNode]
    )

    return (
        <div>
            <ul
                className="menu w-auto h-auto absolute z-50 bg-zinc-900 flex flex-col justify-between border-zinc-800 rounded-md"
                style={{
                    top: props.anchorPoint.y,
                    left: props.anchorPoint.x,
                }}
            >

                {
                    document.getElementById("FileTreeItems")?.contains(props.selectedNode) && isFileOrFolder(props.selectedNode.id) === "file" ?
                        <>
                            <button
                                className="flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700 mt-1"
                                onClick={() => {
                                    props.renaming.current = props.selectedNode.id; //, rename();
                                }}
                            >
                                <VscEdit className="text-s self-center mr-1" />
                                Rename file
                            </button>
                            <button
                                className="flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700  mb-1"
                                onClick={() => {
                                    props.deleteFile(props.selectedNode.id);
                                }}
                            >
                                <VscTrash className="text-s self-center  mr-1" />
                                Delete file
                            </button>
                        </>
                        : document.getElementById("FileTreeItems")?.contains(props.selectedNode) && isFileOrFolder(props.selectedNode.id) === "folder" ?
                            <>
                                <button
                                    className="flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700 mt-1"
                                    onClick={() => {
                                        props.renaming.current = props.selectedNode.id; //, rename();
                                    }}
                                >
                                    <VscEdit className="text-s self-center mr-1" />
                                    Rename Folder
                                </button>
                                <button
                                    className="flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700  mb-1"
                                    onClick={() => {
                                        props.deleteFile(props.selectedNode.id);
                                    }}
                                >
                                    <VscTrash className="text-s self-center  mr-1" />
                                    Delete Folder
                                </button>
                            </>
                            : <></>
                }
            </ul>
        </div>
    );
}

export default ContextMenus;
