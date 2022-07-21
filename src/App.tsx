import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

import { appWindow } from '@tauri-apps/api/window'
import { MdClear, MdMinimize, MdReadMore, MdKeyboardArrowLeft, MdMenuOpen, MdMenu, MdFolderOpen, MdOutlineInsertDriveFile, MdOutlineCreateNewFolder } from 'react-icons/md'
import { IoMdArrowDropright, IoMdArrowDropdown } from "react-icons/io";
import { VscChromeMaximize } from 'react-icons/vsc'
import { readDir, BaseDirectory, FileEntry, readTextFile, writeTextFile } from '@tauri-apps/api/fs';


import CodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { sublime } from '@uiw/codemirror-theme-sublime';
import { EditorView, keymap, highlightActiveLine } from '@codemirror/view'
import { HighlightStyle, tags } from '@codemirror/highlight';




function App() {
  const [count, setCount] = useState(0)
  const [doc, setDoc] = useState('')
  //const [mainFolder, setMainFolder] = useState<folder>(new folder({ name: "Main", path: "C:/Users/Hamis/Documents/NotesCopy" }))
  const [allPaths, setAllPaths] = useState<FileEntry[]>([])
  const [showFileLeaf, setShowFileLeaf] = useState(false)
  const [folderLeafWidth, setFolderLeafWidth] = useState(300)
  const [currentFileContent, setCurrentFileContent] = useState('')
  const [currentFilePath, setCurrentFilePath] = useState("")
  const [currentFileName, setCurrentFileName] = useState("")
  const [wordCount, setWordCount] = useState(0)
  //Setting the window to frameless
  appWindow.setDecorations(false);

  const minimize = () => appWindow.minimize();
  const maximize = () => appWindow.toggleMaximize();
  const close = () => appWindow.close();

  const showFileBrowserLeaf = () => {
    setShowFileLeaf(!showFileLeaf);
  };

  const openNewFile = (path: string, name: string) => {
    if(name.includes(".md")) {
      setCurrentFilePath(path);
      readFile(path);
      setCurrentFileName(name);
    }
  
  }

  const syntaxHighlighting = HighlightStyle.define([
    {
      tag: tags.heading1,
      fontSize: '1.6em',
      fontWeight: 'bold'
    },
    {
      tag: tags.heading2,
      fontSize: '1.4em',
      fontWeight: 'bold'
    },
    {
      tag: tags.heading3,
      fontSize: '1.2em',
      fontWeight: 'bold'
    }
  ])
  
  
  const readFiles = async () => {
    const entries = await readDir('C:/Users/Hamis/Documents/NotesCopy', { recursive: true });
    setAllPaths(entries);
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

  const readFile = async (path: string) => {
    const file = await readTextFile(path);
    console.log(file);
    setCurrentFileContent(file);
  }

  const countWords = (str: string) => {
    var count = 0;
    str.split(/\s+/).forEach((str) => {
      str.length > 0 ? count++ : null
    });
    setWordCount(count);
  }

  const handleClick = (e: any) => {
    let sib = document.getElementById(e)!.nextElementSibling! as HTMLElement;

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
              <div className='bg-zinc-800 '>
                <button id={entry.path} onClick={() => { handleClick(entry.path), openNewFile(entry.path, entry.name) }} className=' bg-zinc-800 flex flex-1 text-left w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none '>{entry.name}{entry.children ? <IoMdArrowDropdown className='place-self-center' /> : null}</button>
                <div style={{ display: "none" }} className='pl-5 bg-zinc-800 duration-200 ease-in-out '> {entry.children ? renderFolders(entry.children) : null} </div>
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
        setFolderLeafWidth(300);
      } else {
        setFolderLeafWidth(leftWidth);
        setShowFileLeaf(true);
      }
      if (leftWidth > 4 && showFileLeaf == false) {
        setShowFileLeaf(true);
      }
    };

  }, []);

  const onChange = useCallback(async (value: any, viewUpdate: any) => {
    console.log('value:', value);
    //save the file
    countWords(value);
    await writeTextFile(currentFilePath, value);
  }, []);

  return (
    <div className=" bg-zinc-900 relative flex flex-col w-screen h-screen overflow-hidden" >
      <div data-tauri-drag-region className="flex  w-screen right-0 left-0 justify-end bg-zinc-900 text-center" >
      <span data-tauri-drag-region className='absolute text-center justify-center place-self-center w-full cursor-default  text-xs  z-10'>{currentFileName}</span>
        <button onClick={minimize} className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none bg-center z-20" > <MdMinimize className='flex-1' /> </button>
        <button onClick={maximize} className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none z-20"> <VscChromeMaximize /> </button>
        <button onClick={close} className="bg-zinc-900 hover:bg-red-600 rounded-none border-none focus:outline-none z-20"> <MdClear /> </button >
      </div>

      <div className=" flex flex-row overflow-hidden">
        <div className="z-10 h-screen bg-zinc-900">
          <button id="fileBrowser" onClick={showFileBrowserLeaf} className="text-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none flex-1 ease-in-out duration-200"> {showFileLeaf ? <MdMenuOpen /> : <MdMenu />} </button>
        </div>
        <div style={showFileLeaf ? { width: folderLeafWidth + 'px' } : { width: '0px' }} className=" z-0 relative h-full flex flex-col overflow-hidden" id='FileBrowserLeaf'>
          <div className="rounded-tl-lg w-full justify-center flex bg-zinc-800 p-3">
            <button className="px-4 py-1 text-2xl  bg-zinc-800 text-zinc-500 font-semibold rounded-none border-none hover:text-white   focus:outline-none "><MdOutlineInsertDriveFile /></button>
            <button className="px-4 py-1 text-2xl bg-zinc-800 text-zinc-500 font-semibold rounded-none border-none hover:text-white   focus:outline-none "><MdOutlineCreateNewFolder /></button>
          </div>
          <div className='bg-zinc-800 w-full h-full overflow-auto pb-10 text-sm text-ellipsis'>
            {renderFolders(allPaths)
            }
          </div>

        </div>
        <div id="resizeBar" className={showFileLeaf ? "w-1 bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50" : " rounded-tl-2xl w-1 bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50"}>

        </div>
        <div id="contentPane" className='bg-zinc-700 w-full h-full overflow-auto flex-1 content-center ' >
          <CodeMirror
            value={currentFileContent}
            onChange={onChange}
            height='100%'
            width='100%'
            theme={sublime}
            extensions={[
              //syntaxHighlighting,
              EditorView.lineWrapping,
              markdown({ base: markdownLanguage, codeLanguages: languages }
              )]}
            className="h-full w-full bg-zinc-700"
          />

        </div>

      </div>
      <div data-tauri-drag-region className="flex  w-screen h-20 justify-end bg-zinc-700 text-center" >
      <span data-tauri-drag-region className='text-center  place-self-center  cursor-default  text-s  z-10 mr-8'> Words: {wordCount}</span>
      </div>
    </div>

  )
}

export default App
