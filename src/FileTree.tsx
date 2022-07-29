import { fs } from '@tauri-apps/api';
import { useEffect, useState } from 'react';
import fsys from 'fs';

function FileTree(props: any) {
    const [files, setFiles] = useState({});

    const test = async (path: string) => {
        const files = await readDir(path).then();
        setFiles(files);
    }

    useEffect(() => {
        console.log(files);
    }
        , [files])

    const isDir = (path: string) => {
        return true;
    }


    const readDir = async (path: string): Promise<{}> => {
        const files = await fs.readDir(path);
        const newFiles = await files.map(async file => {
            return {
                name: file,
                path: file.path,
                isDir: isDir(file.path),
                selected: false,
                children: await file.children?.map(async child => {
                    return await readDir(child.path)
                })
                // await readDir()
            }
        });
        return newFiles;
    }
    return (
        <button onClick={() => {
            test(props.path);
        }}>Test</button>
    )
}


export default FileTree;