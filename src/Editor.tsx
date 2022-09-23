import 'remirror/styles/all.css';

import { BoldExtension, HeadingExtension , ImageExtension, ItalicExtension, MarkdownExtension } from 'remirror/extensions';
import {Remirror, useRemirror } from '@remirror/react';
import { RemirrorEventListener } from '@remirror/core';
import { useEffect, useState,useImperativeHandle, useCallback  } from 'react';
import { Transaction } from '@remirror/pm/dist-types/state';

import {
  ApplySchemaAttributes,
  extension,
  ExtensionTag,
  MarkExtension,
  MarkExtensionSpec,
  MarkSpecOverride,
  command,
  PrimitiveSelection,
  CommandFunction,
  toggleMark,
  getTextSelection,
  AnyExtension
} from '@remirror/core';


export const Editor = (props: { currentFileContent: string; onChange: RemirrorEventListener<Remirror.Extensions> | undefined; } ) => {
  
  const { manager, state,setState  } = useRemirror({
    extensions: () => [new HeadingExtension(), new MarkdownExtension(), new BoldExtension(), new ItalicExtension(),  new ImageExtension() ],
    content: "props.currentFileContent",

    stringHandler: 'markdown',
  });

 
const onDispatchTransaction = useCallback((tr:Transaction ) => {


  return tr;
}, []);

  
  useEffect(() => {
    console.log(props.currentFileContent);
    if(props.currentFileContent !== ""){
      //set the content of the editor
      setState(manager.createState({ content: props.currentFileContent, stringHandler: 'markdown' }));
    }
  }, [props.currentFileContent]);


  return (
    <div className='remirror-theme '>
      {/* the className is used to define css variables necessary for the editor */}
      <Remirror 
      onDispatchTransaction={onDispatchTransaction}
      manager={manager} 
      state={state}
      onChange={(parameter) => {
        // Update the state to the latest value.
        setState(parameter.state);
      }}
      />
    </div>
  );
};