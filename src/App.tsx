import { useMemo, useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

import { appWindow } from '@tauri-apps/api/window'
import { MdClear, MdMinimize, MdReadMore, MdKeyboardArrowLeft, MdMenuOpen, MdMenu, MdFolderOpen, MdOutlineInsertDriveFile, MdOutlineCreateNewFolder } from 'react-icons/md'
import { VscChromeMaximize } from 'react-icons/vsc'
import { readDir, BaseDirectory, FileEntry } from '@tauri-apps/api/fs';


function App() {
  const [count, setCount] = useState(0)
  //const [mainFolder, setMainFolder] = useState<folder>(new folder({ name: "Main", path: "C:/Users/Hamis/Documents/NotesCopy" }))
  const [allPaths, setAllPaths] = useState<FileEntry[]>([])
  //Setting the window to frameless
  appWindow.setDecorations(false);

  const minimize = () => appWindow.minimize();
  const maximize = () => appWindow.toggleMaximize();
  const close = () => appWindow.close();



  const showFileBrowserLeaf = () => {
    let value = document.getElementById('FileBrowserLeaf')!.style.left === '0px';
    console.log(value);


    if (value) {
      document.getElementById('FileBrowserLeaf')!.style.maxWidth = '0px'
      let dx = document.getElementById('FileBrowserLeaf')!.offsetWidth;
      document.getElementById('FileBrowserLeaf')!.style.left = '-' + dx + 'px'
    }
    else {
      document.getElementById('FileBrowserLeaf')!.style.maxWidth = '100%'
      document.getElementById('FileBrowserLeaf')!.style.left = '0px'
    }
  };

  const readFiles = async () => {
    const entries = await readDir('C:/Users/Hamis/Documents/NotesCopy', {recursive: true });
    setAllPaths( allPaths.concat(entries));
    function processEntries(entries: any) {
      for (const entry of entries) {
        console.log(`Entry: ${entry.path}`);
        if (entry.children) {
          processEntries(entry.children)
        }
      }
    }
     processEntries(entries);
  }
  //readFiles();

  // const  renderFolders = async (dir : string) => {
  //     const entries = await readDir(dir, {recursive: true });

  //   return (
  //     <>
  //     <div> dir</div>
  //     {entries.map(async (entry: any) => {
  //       if (entry.type === 'file') {
  //         return (
  //           <div>
  //             <div>{entry.name}</div>
  //           </div>
  //         )
  //       }
  //       else {
  //         return (
  //           <div>
  //             <div>{entry.name}</div>
  //             <div>{await renderFolders(entry.path)}</div>
  //           </div>
  //         )
  //       }
  //     }
  //     )}    
  //     </>
  //     )
  // }

  const renderFolders =  () => {
    return (
      <>
      <div> dir</div>
      {allPaths.map(async (entry: any) => {
        if (entry.type === 'file') {
          return (
            <div>
              <div>{entry.name}</div>
            </div>
          )
        }
        else {
          return (
            <div>
              <div>{entry.name}</div>
              <div>{entry.path}</div>
            </div>
          )
        }
      }
      )}
      </>
      )
  }




  // const renderFolder = (folder : folder, indent : number) => {
  //   return (    
  //   <>
  //        {/* {indent != 0 ?  <div className='indent'></div>  : null}  */}

  //     <div id={String(folder.name)} style={{width: "100%", display: 'none'}}  className="folder">
  //       {folder.folders.map((fol) => {
  //           return (
  //             <>
  //           <button className='file-button' onClick={() => {showFolder(fol)}}> {openedFolders.includes(fol.path) ? < IoMdArrowDropdown/>  :   <IoMdArrowDropright/>}{ " " + fol.name}</Button >   

  //           { renderFolder(fol, indent + 1)}
  //           </>
  //            )
  //       })}
  //       {folder.files.map(file => {

  //           return openedFile === String(folder.path) + '/' +  String(file) ?
  //           <button className='file-button-toggle' onClick={() => {

  //           }}>{file}</button>
  //           :
  //           <button className='file-button'  onClick={() => {
  //             _setOpenedFile(folder,file),

  //             window.electron.ipcRenderer.getFile(folder.path + '/'+file)   
  //           }}>{file}</button>
  //       })}
  //   </div>
  //   </>
  //     )
  // }




  return (
    <div className="relative flex  w-screen flex-col">

      <div data-tauri-drag-region className="flex flex-1 w-screen right-0 left-0 justify-end bg-slate-600">
        <button onClick={minimize} className="bg-sky-600 hover:bg-sky-700 rounded-none border-none focus:outline-none bg-center" > <MdMinimize /> </button>
        <button onClick={maximize} className="bg-sky-600 hover:bg-sky-700 rounded-none border-none focus:outline-none"> <VscChromeMaximize /> </button>
        <button onClick={close} className="bg-sky-600 hover:bg-sky-700 rounded-none border-none focus:outline-none"> <MdClear /> </button >
      </div>

      <div className="relative flex-1 flex flex-row">
        <div className="z-10 h-screen bg-sky-600">
          <button onClick={showFileBrowserLeaf} className="bg-sky-600 hover:bg-sky-700 rounded-none border-none focus:outline-none flex-1"> <MdMenuOpen /> </button>
        </div>
        <div className=" z-0 relative duration-150 ease-in-outh-screen " id='FileBrowserLeaf'>
          <div className=" bg-white w-full h-1/3"></div>
          <div className='bg-black w-full h-2/3  id="file-container'>
            {//renderFolders()
            }
          </div>

        </div>
        <div className='flex-1'>
          <div className='flex-1'>
            <a target="_blank">
              <img src="/vite.svg" className="logo" alt="Vite logo" />
            </a>
            <a target="_blank">
              <img src={reactLogo} className="logo react" alt="React logo" />
            </a>
          </div>
          <h1>Vite + React</h1>
          <div className="card">
            <button onClick={() => setCount((count) => count + 1)}>
              count is {count}
            </button>
            <p>
              Edit <code>src/App.tsx</code> and save to test HMR
            </p>
          </div>
          <p className="read-the-docs">
            Click on the Vite and React logos to learn more
          </p>
        </div>

      </div>
    </div>
  )
}

export default App
