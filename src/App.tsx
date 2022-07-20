import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

import { appWindow } from '@tauri-apps/api/window'
import { MdClear, MdMinimize, MdReadMore, MdKeyboardArrowLeft, MdMenuOpen, MdMenu, MdFolderOpen, MdOutlineInsertDriveFile, MdOutlineCreateNewFolder } from 'react-icons/md'
import { IoMdArrowDropright, IoMdArrowDropdown } from "react-icons/io";
import { VscChromeMaximize } from 'react-icons/vsc'
import { readDir, BaseDirectory, FileEntry } from '@tauri-apps/api/fs';


import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';


function App() {
  const [count, setCount] = useState(0)
  const [doc, setDoc] = useState('')
  //const [mainFolder, setMainFolder] = useState<folder>(new folder({ name: "Main", path: "C:/Users/Hamis/Documents/NotesCopy" }))
  const [allPaths, setAllPaths] = useState<FileEntry[]>([])
  const [showFileLeaf, setShowFileLeaf] = useState(false)
  const [folderLeafWidth, setFolderLeafWidth] = useState(200)
  //Setting the window to frameless
  appWindow.setDecorations(false);

  const minimize = () => appWindow.minimize();
  const maximize = () => appWindow.toggleMaximize();
  const close = () => appWindow.close();

  const showFileBrowserLeaf = () => {
    setShowFileLeaf(!showFileLeaf);
  };

  const readFiles = async () => {
    const entries = await readDir('C:/Users/Hamis/Documents/NotesCopy', { recursive: true });
    setAllPaths(allPaths.concat(entries));
    // function processEntries(entries: any) {
    //   for (const entry of entries) {
    //     console.log(`Entry: ${entry.path}`);
    //     if (entry.children) {
    //       processEntries(entry.children)
    //     }
    //   }
    // }
    // processEntries(entries);
  }

  const handleClick = (e: any) => {
    let sib = document.getElementById(e.target.id)!.nextElementSibling! as HTMLElement;
    if (sib.style.display === "none") {

      sib.style.display = "block"
    } else {
      sib.style.display = "none"
    }
  }
  const renderFolders = (entries: any[]) => {
    entries = entries.filter(entry => !(entry.name?.charAt(0) === '.'));
    entries.sort((a, b) => {
      if (a.children && !b.children) {
        return -1;
      }
      if (!a.children && b.children) {
        return 1;
      }
      return a.name!.localeCompare(b.name!);
    }
    );
    return (
      <div>
        {entries.map((entry: any) => {
          if (entry.type === 'file') {
            return (
              <div>
                <div>{entry.name}</div>
              </div>
            )
          }
          else {
            return (
              <div className='bg-zinc-800'>
                <button id={entry.path} onClick={handleClick} className='text-ellipsis overflow-hidden bg-zinc-800 flex w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none '>{entry.name}{entry.children ? <IoMdArrowDropdown className='place-self-center' /> : null}</button>
                <div className='pl-5 bg-zinc-800 duration-200 ease-in-out'> {entry.children ? renderFolders(entry.children) : null} </div>
              </div>
            )
          }
        }
        )}
      </div>
    )
  }


  useEffect(() => {
    readFiles();

    // Query the element
    const resizer = document.getElementById('resizeBar')!;
    const leftSide = document.getElementById('FileBrowserLeaf')!;
    const rightSide = document.getElementById('contentPane')!;

    // The current position of mouse
    let x = 0;
    let y = 0;

    // Width of left side
    let leftWidth = 0;

    // Handle the mousedown event
    // that's triggered when user drags the resizer
    const mouseDownHandler = function (e: { clientX: number; clientY: number }) {
      // Get the current mouse position
      x = e.clientX;
      y = e.clientY;
      leftWidth = parseInt(getComputedStyle(leftSide, '').width); //leftSide.getBoundingClientRect().width;

      // Attach the listeners to `document`
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };

    // Attach the handler
    resizer.addEventListener('mousedown', mouseDownHandler);

    const mouseMoveHandler = function (e: { clientX: number; clientY: number }) {
      // How far the mouse has been moved
      const dx = e.clientX - x;

      let newLeftWidth = ((leftWidth + dx) * 100) / resizer.parentElement!.getBoundingClientRect().width;
      if (newLeftWidth < 4) {
        newLeftWidth = 0;
      }

      leftSide.style.width = `${newLeftWidth}%`;

      document.body.style.cursor = 'col-resize';
      document.body.style.cursor = 'col-resize';

      leftSide.style.userSelect = 'none';
      leftSide.style.pointerEvents = 'none';

      rightSide.style.userSelect = 'none';
      rightSide.style.pointerEvents = 'none';
    };

    const mouseUpHandler = function () {
      resizer.style.removeProperty('cursor');
      document.body.style.removeProperty('cursor');

      leftSide.style.removeProperty('user-select');
      leftSide.style.removeProperty('pointer-events');

      rightSide.style.removeProperty('user-select');
      rightSide.style.removeProperty('pointer-events');

      // Remove the handlers of `mousemove` and `mouseup`
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);

      leftWidth = parseInt(getComputedStyle(leftSide, '').width);
      if (leftWidth < 4) {
        setShowFileLeaf(false);
        setFolderLeafWidth(200);
      } else {
        setFolderLeafWidth(leftWidth);
        setShowFileLeaf(true);
      }
      if (leftWidth > 4 && showFileLeaf == false) {
        setShowFileLeaf(true);
      }
    };

  }, []);

  const handleDocChange = useCallback((newDoc: any) => {
    setDoc(newDoc);
    //openedFile !== "" && !saving && newDoc !== doc? 
    //window.electron.ipcRenderer.saveFile(openedFile, newDoc)  : null
  }, [doc])

  return (
    <div className=" bg-zinc-900 relative flex flex-col w-screen" >
     <div data-tauri-drag-region className="flex  w-screen right-0 left-0 justify-end bg-zinc-900">
        <button onClick={minimize} className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none bg-center" > <MdMinimize className='flex-1' /> </button>
        <button onClick={maximize} className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none"> <VscChromeMaximize /> </button>
        <button onClick={close} className="bg-zinc-900 hover:bg-red-600 rounded-none border-none focus:outline-none"> <MdClear /> </button >
      </div>
      <div className="relative flex-1 flex flex-row">
        <div className="z-10 h-screen bg-zinc-900">
          <button id="fileBrowser" onClick={showFileBrowserLeaf} className="text-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none flex-1 ease-in-out duration-200"> {showFileLeaf ? <MdMenuOpen /> : <MdMenu />} </button>
        </div>
        <div style={showFileLeaf ? { width: folderLeafWidth + 'px' } : { width: '0px' }} className=" z-0 relative h-screen flex flex-col overflow-hidden resize-x" id='FileBrowserLeaf'>
          <div className="rounded-tl-xl w-full justify-center flex bg-zinc-800 p-3">
            <button className="px-4 py-1 text-2xl  bg-zinc-800 text-zinc-500 font-semibold rounded-none border-none hover:text-white   focus:outline-none "><MdOutlineInsertDriveFile /></button>
            <button className="px-4 py-1 text-2xl bg-zinc-800 text-zinc-500 font-semibold rounded-none border-none hover:text-white   focus:outline-none "><MdOutlineCreateNewFolder /></button>
          </div>
          <div className='bg-zinc-800 w-full  id="file-container  flex-1 overflow-auto pb-10 text-sm'>
            {renderFolders(allPaths)
            }
          </div>

        </div>
        <div id="resizeBar" className={showFileLeaf ? "w-1 bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50" : " rounded-tl-2xl w-1 bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50"}>

        </div>
        <div id="contentPane" className='bg-zinc-700 flex-shrink-0 flex-grow-0 flex-1' >
          <CodeMirror 
          value={"j"} 
            height='100%'
          extensions={[
            markdown({ base: markdownLanguage, codeLanguages: languages }
          )]} 
          />
          
        </div>

      </div> 
    </div>
    
  )
}

export default App
