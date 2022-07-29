import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

import { appWindow } from '@tauri-apps/api/window'
import { MdClear, MdMinimize, MdReadMore, MdKeyboardArrowLeft, MdMenuOpen, MdMenu, MdFolderOpen, MdOutlineInsertDriveFile, MdOutlineCreateNewFolder } from 'react-icons/md'
import { IoMdArrowDropright, IoMdArrowDropdown } from "react-icons/io";
import { VscChromeMaximize, VscGear, VscEdit, VscTrash } from 'react-icons/vsc'
import { readDir, BaseDirectory, FileEntry, readTextFile, writeTextFile, renameFile, createDir, removeDir, removeFile } from '@tauri-apps/api/fs';



import { invoke } from '@tauri-apps/api';

import Editor from './Editor';
import SideBar from './SideBar';
import FileTree from './FileTree';


function App() {
  const [count, setCount] = useState(0)
  const [doc, setDoc] = useState('')
  //const [mainFolder, setMainFolder] = useState<folder>(new folder({ name: "Main", path: "C:/Users/Hamis/Documents/NotesCopy" }))
  const [mainFolder, setMainFolder] = useState("C:/Users/Hamis/Documents/NotesCopy")
  const [allPaths, setAllPaths] = useState<FileEntry[]>([])
  const [showFileLeaf, setShowFileLeaf] = useState(false)
  const [folderLeafWidth, setFolderLeafWidth] = useState(300)
  const [currentFileContent, setCurrentFileContent] = useState('')
  const [currentFilePath, setCurrentFilePath] = useState("")
  const [oldFilePath, setOldFilePath] = useState("")
  const [currentFileName, setCurrentFileName] = useState("")
  const [wordCount, setWordCount] = useState(0)
  const [settingsModal, setSettingsModal] = useState(false)
  const [settings, setSettings] = useState({ editorWidth: 700 })
  const [deleting, setDeleting] = useState("")

  const [edit, setEdit] = useState(false)

  const [renaming, setRenaming] = useState("")

  //Setting the window to frameless
  appWindow.setDecorations(false);

  const minimize = () => appWindow.minimize();
  const maximize = () => appWindow.toggleMaximize();
  const close = () => appWindow.close();

  const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
  const [showEditorContext, setShowEditorContext] = useState(false);
  const [showFileContext, setShowFileContext] = useState(false);
  const [contextID, setContextID] = useState("");



  const createNewFile = async () => {
    let num = 0
    let loop = true;
    let newFileName = "Untitled.md"


    while (loop) {
      try {
        await readTextFile(mainFolder + "/" + newFileName);
        num += 1;
        newFileName = "Untitled " + num + ".md"
      } catch (error) {
        await writeTextFile(mainFolder + "/" + newFileName, "")
        loop = false;
      }
    }

    await readFiles()
    await setCurrentFilePath(mainFolder + "/" + newFileName)
    openNewFile(mainFolder + "/" + newFileName, newFileName)
  }

  const createNewFolder = async () => {
    let num = 0
    let loop = true;

    let newFolderName = mainFolder + "/" + "Untitled"

    while (loop) {
      try {
        await createDir(newFolderName)
        loop = false
      } catch (error) {
        num += 1;
        newFolderName = mainFolder + "/" + "Untitled " + num
      }
    }

    await readFiles()
    setContextID(newFolderName)
    setRenaming(newFolderName)
  }

  useEffect(() => {
    rename()
  }, [renaming])


  const handleContextMenu = useCallback(
    (event: { preventDefault: () => void; pageX: any; pageY: any; target: { id: any; }; }) => {
      event.preventDefault();
      setAnchorPoint({ x: event.pageX, y: event.pageY });
      if (showEditorContext || showFileContext) {
        setShowEditorContext(false)
        setShowFileContext(false)
      }
      if (isFileOrFolder(event.target.id) == "file") {
        setShowFileContext(true);
      } else if (isFileOrFolder(event.target.id) == "folder") {
        setShowEditorContext(true);
      } else {
        setShowEditorContext(true);
      }
      setContextID(event.target.id);

    },
    [setAnchorPoint]
  );

  const handleContextClick = useCallback(() => (showEditorContext || showFileContext ? (setShowEditorContext(false), setShowFileContext(false)) : null), [showEditorContext, showFileContext]);

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

  const rename = () => {
    let child: HTMLElement
    if (contextID.includes(":name")) {
      child = document.getElementById(contextID)!
    } else {
      child = document.getElementById(contextID + ":name")!
    }

    if (!child) {
      return;
    }

    child.classList.add("renaming")
    child.contentEditable = "true"
    child.focus()
    document.execCommand('selectAll', false, undefined)


    document.addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        finishRename(child.innerText!)
      } else if (e.key == "Space") {

      }
    })

    child.addEventListener("blur", (e) => finishRename(child.innerText!))

  }

  const finishRename = async (n: string) => {
    let child = null
    if (contextID.includes(":name")) {
      child = document.getElementById(contextID)!
    } else {
      child = document.getElementById(contextID + ":name")!
    }
    child.contentEditable = "false"
    child.classList.remove("renaming")

    let nPath = ""
    let split = contextID.split("\\")

    for (let i = 0; i < split.length - 1; i++) {
      nPath += split[i] + "\\"
    }
    nPath += n
    const newName = nPath
    let oldName = contextID
    if (oldName.includes(":name")) {
      oldName = oldName.split(":name")[0]
    }
    await renameFile(oldName, newName);
    setRenaming("")
    setContextID("")

  }


  const isFileOrFolder = (path: string) => {
    const re = new RegExp("[.][a-z]*");
    if (path.endsWith(".md")) {
      return "file";
    } else if (re.test(path)) {
    return "none";
    }
    return 'folder'
  }
  const showFileBrowserLeaf = () => {
    console.log(!showFileLeaf)
    setShowFileLeaf(!showFileLeaf);
  };

  const showSettingsModal = () => {
    setSettingsModal(!settingsModal);
  }

  useEffect(() => {
    const elem = document.getElementById("FileBrowserLeaf")!
    elem.classList.add("transition-all")
    elem.addEventListener('transitionend', function (event) {
      elem.classList.remove("transition-all")
    }, false);
  }, [showFileLeaf])

  const openNewFile = (path: string, name: string) => {
    if (name.includes(".md")) {


      setOldFilePath(contextID)
      setCurrentFilePath(path);


      setCurrentFileName(name);

    }

  }

  useEffect(() => {
    if (currentFilePath != "" && currentFilePath.includes(".md")) {
      const elem = document.getElementById(currentFilePath)!
      if (elem) {
        document.getElementById(currentFilePath)!.classList.add("active")
        readFile(currentFilePath);
      }
    }
  }, [document.getElementById(currentFilePath)]);

  const removeHighlight = () => {
    if (currentFilePath != "" && currentFilePath.includes(".md")) {
      document.getElementById(currentFilePath)!.classList.remove("active")
    }
    setCurrentFilePath("")
    setCurrentFileName("")
  }

  useEffect(() => {
    if (oldFilePath != "" && oldFilePath.includes(".md") && currentFilePath != oldFilePath) {
      document.getElementById(oldFilePath)!.classList.remove("active")
      console.log("old file path " + oldFilePath)
    }
  }, [oldFilePath]);


  useEffect(() => {
    if (renaming) {
      rename()
    }
  }), [allPaths]


  const readFiles = async () => {
    const entries = await readDir(mainFolder, { recursive: true });

    setAllPaths(entries);

  }

  const readFile = async (path: string) => {
    const file = await readTextFile(path);
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
                {isFileOrFolder(entry.path) == "none" ? <div className="tooltip " data-tip="Invalid filetype"> <button id={entry.path}  className=' bg-zinc-800 opacity-25 flex flex-1 text-left w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none '>    <div id={entry.path + ":name"}>{entry.name}</div>{entry.children ? <IoMdArrowDropdown className='place-self-center' /> : null}</button> </div> : <button id={entry.path} onClick={() => { handleClick(entry.path), setOldFilePath(currentFilePath), setCurrentFilePath(entry.path) }} className=' bg-zinc-800 flex flex-1 text-left w-full outline-none border-none rounded-none focus:rounded-none focused hover:bg-zinc-600 focus:outline-none '> <div id={entry.path + ":name"}>{entry.name}</div>{entry.children ? <IoMdArrowDropdown className='place-self-center' /> : null}</button>} 
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

      if (newLeftWidth > 4) {
        setShowFileLeaf(true);
      } else {
        setShowFileLeaf(false);
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

  // useEffect(() => {
  //   readFiles();

  //   // Query the element
  //   const resizer = document.getElementById('EditorResizeBar')!;
  //   const leftSide = document.getElementById('FileBrowserLeaf')!;
  //   const rightSide = document.getElementById('contentPane')!;

  //   // The current position of mouse
  //   let x = 0;
  //   let y = 0;

  //   // Width of left side
  //   let leftWidth = 0;

  //   // Handle the mousedown event
  //   // that's triggered when user drags the resizer
  //   const mouseDownHandler = function (e: { clientX: number; clientY: number }) {
  //     // Get the current mouse position
  //     x = e.clientX;
  //     y = e.clientY;
  //     leftWidth = parseInt(getComputedStyle(leftSide, '').width); //leftSide.getBoundingClientRect().width;

  //     // Attach the listeners to `document`
  //     document.addEventListener('mousemove', mouseMoveHandler);
  //     document.addEventListener('mouseup', mouseUpHandler);
  //   };

  //   // Attach the handler
  //   resizer.addEventListener('mousedown', mouseDownHandler);

  //   const mouseMoveHandler = function (e: { clientX: number; clientY: number }) {
  //     // How far the mouse has been moved
  //     const dx = e.clientX - x;

  //     let newLeftWidth = ((leftWidth + dx) * 100) / resizer.parentElement!.getBoundingClientRect().width;
  //     if (newLeftWidth < 4) {
  //       newLeftWidth = 0;
  //     }

  //     leftSide.style.width = `${newLeftWidth}%`;

  //     document.body.style.cursor = 'col-resize';
  //     document.body.style.cursor = 'col-resize';

  //     leftSide.style.userSelect = 'none';
  //     leftSide.style.pointerEvents = 'none';

  //     rightSide.style.userSelect = 'none';
  //     rightSide.style.pointerEvents = 'none';
  //   };

  //   const mouseUpHandler = function () {
  //     resizer.style.removeProperty('cursor');
  //     document.body.style.removeProperty('cursor');

  //     leftSide.style.removeProperty('user-select');
  //     leftSide.style.removeProperty('pointer-events');

  //     rightSide.style.removeProperty('user-select');
  //     rightSide.style.removeProperty('pointer-events');

  //     // Remove the handlers of `mousemove` and `mouseup`
  //     document.removeEventListener('mousemove', mouseMoveHandler);
  //     document.removeEventListener('mouseup', mouseUpHandler);

  //     leftWidth = parseInt(getComputedStyle(leftSide, '').width);
  //     if (leftWidth < 4) {
  //       setShowFileLeaf(false);
  //       setFolderLeafWidth(300);
  //     } else {
  //       setFolderLeafWidth(leftWidth);
  //       setShowFileLeaf(true);
  //     }
  //     if (leftWidth > 4 && showFileLeaf == false) {
  //       setShowFileLeaf(true);
  //     }
  //   };

  // }, []);
  const deleteFile = async (path: string) => {
    const p = path.replace(":name", "")
    if (currentFilePath == p) {
      removeHighlight();
      setCurrentFilePath("");
      setCurrentFileName("");
      setOldFilePath("");
      setCurrentFileContent("");
    }
    if (isFileOrFolder(p) == "file") {
      await invoke('deleteFile', { path: p });
    }
    else if (isFileOrFolder(p) == "folder") {
      await invoke('deleteDir', { path: p });
    }

    //unselect the file

    await readFiles();
  }

  const onChange = useCallback(async (value: any, viewUpdate: any) => {
    //save the file
    countWords(value);
    await writeTextFile(currentFilePath, value);
  }, [currentFilePath]);

  return (
    <div className="z-0 bg-zinc-900 flex flex-col w-screen h-screen overflow-hidden rounded-xl" >
      {showEditorContext ? (
        <ul
          className="menu w-auto h-auto absolute z-50 bg-zinc-900 flex flex-col justify-between border-zinc-800 rounded-md"
          style={{
            top: anchorPoint.y,
            left: anchorPoint.x
          }}
        >
          <button className='flex text-center align-middle text-sm rounded-none border-none bg-transparent hover:bg-zinc-700 mt-1' onClick={() => { setRenaming(contextID), rename() }}><VscEdit className='text-s self-center mr-1' />Rename folder</button>
          <button className='flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700 mb-1' onClick={() => { deleteFile(contextID) }}><VscTrash className='text-s self-center  mr-1' />Delete folder</button>
        </ul>
      ) : (
        <> </>
      )}

      {showFileContext ? (
        <ul
          className="menu w-auto h-auto absolute z-50 bg-zinc-900 flex flex-col justify-between"
          style={{
            top: anchorPoint.y,
            left: anchorPoint.x
          }}
        >
          <button className='flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700 mt-1' onClick={() => { setRenaming(contextID), rename() }}><VscEdit className='text-s self-center mr-1' />Rename file</button>
          <button className='flex text-center align-middle text-sm  rounded-none border-none bg-transparent hover:bg-zinc-700  mb-1' onClick={() => { deleteFile(contextID) }}><VscTrash className='text-s self-center  mr-1' />Delete file</button>
        </ul>
      ) : (
        <> </>
      )}


      <div data-tauri-drag-region className="z-50 flex  w-screen right-0 left-0 justify-end bg-zinc-900 text-center" >
        <span data-tauri-drag-region className='absolute text-center justify-center place-self-center w-full cursor-default  text-xs  z-10'>{currentFileName}</span>
        <button onClick={minimize} className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none bg-center z-20" > <MdMinimize className='flex-1' /> </button>
        <button onClick={maximize} className="bg-zinc-900 hover:bg-zinc-600 rounded-none border-none focus:outline-none z-20"> <VscChromeMaximize /> </button>
        <button onClick={close} className="bg-zinc-900 hover:bg-red-600 rounded-none border-none focus:outline-none z-20"> <MdClear /> </button >
      </div>
      {settingsModal ?
        <div className="z-20 top-0 left-0  w-screen h-screen  absolute flex place-content-center">
          <div onClick={showSettingsModal} className="absolute z-40  bg-black opacity-50 w-full h-full">
          </div>
          <div className=' z-50 opacity-100 relative  ml-auto mr-auto mt-auto top-0 bottom-0 mb-auto  left-0 right-0  w-4/5 h-4/5 bg-zinc-800  rounded-xl border-zinc-900 shadow-lg'>
            <div className='justify-center'>SETTINGS</div>
            <button onClick={showSettingsModal} className="absolute right-0 top-0 text-zinc-400 hover:text-zinc-100 bg-transparent rounded-none border-none focus:outline-none z-20"> <MdClear /> </button >
            <br />
            {/* <div className="grid grid-rows-3 grid-flow-col gap-4 text-center ">
              <div className="row-span-3 bg-gray-900 ">01</div>
              <div className="col-span-2 bg-gray-900 ">02</div>
              <div className="row-span-2 col-span-2 bg-gray-900 ">03</div>
            </div> */}
            <div className="divider"></div>
            <div className='flex flex-row w-full  px-10'>
              <div className=' flex-1 flex flex-col items-start'>
                <label className='flex-1'>Editor Width  </label>
                <label className='flex-1 text-gray-400'>The width of the editor in pixels</label>
              </div>
              <div className='text-end float flex-1 flex flex-col items-end'>
                <input className='w-1/2' type='number' value={settings.editorWidth} onChange={(e) => { setSettings({ ...settings, editorWidth: parseInt(e.target.value) }), document.getElementById("codeMirror")!.style.maxWidth = e.target.value + 'px' }} />
                <input className="range range-primary w-1/2 " type="range" min="100" max="2000" value={settings.editorWidth} onChange={(e) => { setSettings({ ...settings, editorWidth: parseInt(e.target.value) }), document.getElementById("codeMirror")!.style.maxWidth = e.target.value + 'px' }} />
              </div>
              <div className='pl-2'>
                px
              </div>
            </div>
            <div className="divider"></div>
          </div>
        </div>
        : null}
      <div className="z-0 flex flex-row h-full overflow-hidden">
        {/* <div className="justify-between flex flex-col z-10 h-full bg-zinc-900">
          <button id="fileBrowser" onClick={showFileBrowserLeaf} className="text-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200"> {showFileLeaf ? <MdMenuOpen /> : <MdMenu />} </button>
          <button id="fileBrowser" onClick={showSettingsModal} className='text-lg text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-900 rounded-none border-none focus:outline-none ease-in-out duration-200'> {showFileLeaf ? <VscGear /> : <VscGear />} </button>
        </div> */}
        <SideBar showFileBrowserLeaf={showFileBrowserLeaf} showFileLeaf={showFileLeaf} showSettingsModal={showSettingsModal} />
        <div style={showFileLeaf ? { width: folderLeafWidth + 'px' } : { width: '0px' }} className=" z-0 relative h-full flex max-w-[80%] flex-col overflow-hidden" id='FileBrowserLeaf'>
          <div className="rounded-tl-lg w-full justify-center flex bg-zinc-800 p-3">
            <button onClick={createNewFile} className="px-4 py-1 text-2xl  bg-zinc-800 text-zinc-500 font-semibold rounded-none border-none hover:text-white   focus:outline-none "><MdOutlineInsertDriveFile /></button>
            <button onClick={createNewFolder} className="px-4 py-1 text-2xl bg-zinc-800 text-zinc-500 font-semibold rounded-none border-none hover:text-white   focus:outline-none "><MdOutlineCreateNewFolder /></button>
            <FileTree path={mainFolder} />
          </div>
          <div id="folderTree" className='bg-zinc-800 w-full h-full overflow-auto pb-10 text-sm text-ellipsis'>
            {renderFolders(allPaths)
            }
          </div>

        </div>
        <div id="resizeBar" className={showFileLeaf ? "w-1 bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50" : " rounded-tl-2xl w-1 bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50"}>

        </div>
        <div id="contentPane" className='bg-zinc-700 w-full h-full overflow-auto flex-1 place-items-center ' >
          <Editor onChange={onChange} currentFileContent={currentFileContent} />
        </div>
      </div>
      <div data-tauri-drag-region className="flex  w-screen h-8 justify-end bg-zinc-800 text-center" >
        <span data-tauri-drag-region className='text-center  place-self-center  cursor-default  text-sm  z-10 mr-8 text-zinc-400'>  {wordCount} Words</span>
      </div>
    </div>

  )
}

export default App

