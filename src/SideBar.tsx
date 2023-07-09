import { MdMenu, MdMenuOpen } from "react-icons/md";
import IconToggle from "./IconToggle";
function Editor(props: any) {

    return (
        <div className="flex justify-between flex-col z-10 h-full w-10 bg-zinc-900">
            <div
                className="flex justify-center hover:text-zinc-500 text-zinc-500 text-xl focus:outline-none ease-in-out"
            >
                <IconToggle
                    onClick={props.showFileBrowserLeaf}
                    icon1={MdMenu}
                    icon2={MdMenuOpen}
                />
            </div>
            <div
                className="flex justify-center hover:text-zinc-500 text-zinc-500 text-xl focus:outline-none ease-in-out"
            >
                <IconToggle
                    onClick={props.showSettingsModal}
                    icon1={MdMenu}
                    icon2={MdMenuOpen}
                />
            </div>
        </div>
    );
}

export default Editor;
