import { useState } from 'react';
import { MdMenu, MdMenuOpen } from 'react-icons/md';
import { VscGear } from 'react-icons/vsc';

function Editor(props: any) {

    return (
        <div className="justify-between flex flex-col z-10 h-full w-10 bg-zinc-900">
            {/* <button id="fileBrowser" onClick={showFileBrowserLeaf} className="text-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200"> {showFileLeaf ? <MdMenuOpen /> : <MdMenu />} </button>
    <button id="fileBrowser" onClick={showSettingsModal} className='text-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200'> {showFileLeaf ? <VscGear /> : <VscGear />} </button> */}
                <label className="swap swap-flip h-10 hover:text-white text-zinc-500" >
                    <input type="checkbox" checked={props.showFileLeaf} onClick={props.showFileBrowserLeaf}/>
                    <MdMenuOpen  className="swap-on text-xl   bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200" />
                    <MdMenu className="swap-off text-xl  text-inherit bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200" />
                </label>
                <label className="swap swap-rotate h-10 hover:text-white text-zinc-500">
                    <input type="checkbox" onClick={props.showSettingsModal}/>
                    <VscGear className="swap-on text-xl bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200" />
                    <VscGear className="swap-off text-xl bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200" />
                </label>
        </div>
    )
}

export default Editor;