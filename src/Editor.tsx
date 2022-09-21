import 'remirror/styles/all.css';

import { BoldExtension, HeadingExtension, ImageExtension, ItalicExtension, MarkdownExtension } from 'remirror/extensions';
import { useHelpers, Remirror, useRemirror, useRemirrorContext, useCommands, useChainedCommands } from '@remirror/react';
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
    extensions: () => [new BoldExtension(), new MarkdownExtension(),new HeadingExtension(), new ImageExtension(), new ItalicExtension()],
    content: "props.currentFileContent",
    selection: 'start',
    stringHandler: 'markdown',
  });
  const chain = useChainedCommands();

  const handleUpdateHref = useCallback(
    (href) => {
      chain.focus();
  
      if (href === '') {
        chain.removeLink();
      } else {
        chain.updateLink({ href });
      }
  
      chain.run();
    },
    [chain],
  );

  const Editor = () => {
    const [boldActive] = useState(false);
  
    const { getRootProps, commands } = useRemirrorContext({ autoUpdate: true });
  
    return (
      <div>
        <button
          onClick={() => commands.toggleBold()}
          style={{ fontWeight: activeCommands.bold ? 'bold' : undefined }}
        >
          B
        </button>
        <div {...getRootProps()} />
      </div>
    );
  }

const onDispatchTransaction = useCallback((tr:Transaction ) => {
  //get the selected node
  // const { toggleBold, toggleItalic,toggleHeading } = useCommands();
  const node = tr.selection.$from.node();
  //change the markup of the node
  if(node.type.name === "heading") {

  }

  
}, []);

  



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