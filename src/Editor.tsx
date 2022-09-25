import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Ancestor,
	BaseEditor,
	Descendant,
	NodeEntry,
	Path,
	Selection,
} from "slate";
import { ReactEditor } from "slate-react";
import {
	createEditor,
	Node,
	Editor as slateEditor,
	Element as SlateElement,
	Range,
	Transforms,
	Point,
} from "slate";
import { Slate, Editable, withReact } from "slate-react";
import { withHistory } from "slate-history";
import { BulletedListElement, CustomEditor } from "./custom-types";

// type CustomElement = { type: 'paragraph'; children: CustomText[] }
// type CustomText = { text: string }

// declare module 'slate' {
//   interface CustomTypes {
//     Editor: BaseEditor & ReactEditor
//     Element: CustomElement
//     Text: CustomText
//   }
// }

const SHORTCUTS = {
	"*": "list-item",
	"-": "list-item",
	"+": "list-item",
	">": "block-quote",
	"#": "heading-one",
	"##": "heading-two",
	"###": "heading-three",
	"####": "heading-four",
	"#####": "heading-five",
	"######": "heading-six",
};

//oposites of shortcuts
const reverseSHORTCUTS = {
	"list-item": "-",
	"block-quote": ">",
	"heading-one": "#",
	"heading-two": "##",
	"heading-three": "###",
	"heading-four": "####",
	"heading-five": "#####",
	"heading-six": "######",
};

const initialValue: Descendant[] = [
	{
		type: "paragraph",
		children: [{ text: "A line of text in a paragraph." }],
	},
];

const convertMarkdown = (text: string) => {
	if (text) {
		const lines = text.split(" \n");
		const nodes: Descendant[] = [];
		lines.forEach((line) => {
			if (/(#{1}\s)(.*)/.test(line)) {
				// nodes.push({
				//   type: 'heading-one',
				//   children: [{ text: line }],
				// })
			}
		});
		return nodes;
	}
};

// export const Editor = (props: { currentFileContent: string; }) => {
//   const [editor] = useState(() => withReact(withHistory(createEditor())))
//   const [value, setValue] = useState<Descendant[]>(initialValue)

// useEffect(() => {
//   const nodes = convertMarkdown(props.currentFileContent)
//   // setValue(nodes!)
//   // console.log(nodes)
//   editor.children = nodes!
// }, [props.currentFileContent])

export const Editor = () => {
	const [oldBlock, setOldBlock] = useState<NodeEntry<Ancestor> | Path[] | null>(
		null
	);
	const updateNodeType = () => {
		const newBlock = slateEditor.above(editor, {
			match: (n) => slateEditor.isBlock(editor, n),
		});

   

		if (newBlock) { // && newBlock[0].type !== "paragraph") {
			console.log(newBlock);
			//loop through the children of the block

			const blockText = newBlock[0].children[0].text;
			console.log(blockText);
			if (!blockText.startsWith(reverseSHORTCUTS[newBlock[0].type] + " ")) {
				console.log("CHANGING BLOCK TYPE");
				const textType = blockText.split(" ")[0];
				const newType = SHORTCUTS[textType];
				console.log(newType);
				if (newType) {
					const newProperties: Partial<Element> = {
						type: newType,
					};
					Transforms.setNodes(editor, newProperties);
				} else {
					const newProperties: Partial<Element> = {
						type: "paragraph",
					};
					Transforms.setNodes(editor, newProperties);
				}
        

        const newBlock = slateEditor.above(editor, {
          match: (n) => slateEditor.isBlock(editor, n),
        });
        setOldBlock(newBlock)
			}
		} 
	};

	const updateDisplay = () => {
		const block = slateEditor.above(editor, {
			match: (n) => slateEditor.isBlock(editor, n),
		});
    console.log("UPDATE DISPLAY")
		if (block) {
      console.log(block)
			//get current selection
			const selection = editor.selection;

			const [blockNode, blockPath] = block;
			//console.log(blockNode)
			//get its type
			//console.log(blockPath)
			const blockType = blockNode.type;

			//get node
			if (oldBlock && oldBlock[1][0] != block[1][0]) {
				console.log("different");
				//get the node at the position of the old block
				const oldBlockNode = Node.get(editor, oldBlock[1]);
				//remove the old block

				//get the old blocks children
				const oldBlockChildren: Array<Text> = oldBlockNode.children;
				for (const child of oldBlockChildren) {
					console.log(child);
				}
				//insert the new text node

				//get the text
				const text = oldBlockChildren[0].text;

				if (text) {
					console.log("REMOVE" + text);
					//remove the old block type
					console.log(oldBlock[0].type);
					const nText = text.replace(
						reverseSHORTCUTS[oldBlock[0].type] + " ",
						""
					);
					//set the text of the old block to the new text
					console.log(nText);
					Transforms.removeNodes(editor, { at: oldBlock[1] });
					//insert a new block
					Transforms.insertNodes(
						editor,
						{
							type: oldBlockNode.type,
							children: [{ text: nText }],
						},
						{ at: oldBlock[1] }
					);
					setOldBlock(null);
				}
			}

			if (blockType != "paragraph") {
				//get the blocks type
				const blockType = blockNode.type;

				//get the text of the block
				const text = blockNode.children[0].text;
				console.log(text);

				if (oldBlock && oldBlock[1][0] == block[1][0]) {
					console.log("same block");

					return;
				}
				// if(text && text.startsWith(reverseSHORTCUTS[blockType])) {
				//   setOldBlock(block)
				//   return
				// }

				//clean the text of the old block

				//get the blocks text
				const blockText = blockNode.children[0].text;
				//add the block type to the beginning of the block text
				const newBlockText = reverseSHORTCUTS[blockType] + " " + blockText;
				//insert text
        if(!blockText.startsWith(reverseSHORTCUTS[blockType]+ " ")) {
				Transforms.insertText(editor, newBlockText, { at: blockPath });

				const typeLength = reverseSHORTCUTS[blockType].length + 1;
				//create a selection
				const newSelection = {
					anchor: {
						path: blockPath,
						offset: typeLength + selection?.anchor.offset,
					},
					focus: {
						path: blockPath,
						offset: typeLength + selection?.focus.offset,
					},
				};

				//set the selection to the selection
				Transforms.select(editor, newSelection);
				// //get the length of the type

				// //set the selection to the end of the type
				// Transforms.move(editor, { distance: typeLength, edge: 'anchor' })

				
        }
        setOldBlock(block);
			}

			//set the selection to the current selection plus the length of the block type
		}
	};

	const withShortcuts = (editor: CustomEditor) => {
		const { deleteBackward, insertText } = editor;

		editor.insertText = (text) => {
      console.log("inserting text: " + text)
			const { selection } = editor;
			//console.log(selection)
			if (text.endsWith(" ") && selection && Range.isCollapsed(selection)) {
				const { anchor } = selection;
				const block = slateEditor.above(editor, {
					match: (n) => slateEditor.isBlock(editor, n),
				});
				const path = block ? block[1] : [];
				const start = slateEditor.start(editor, path);
				const range = { anchor, focus: start };
				const beforeText =
					slateEditor.string(editor, range) + text.slice(0, -1);
				//console.log(beforeText)
				const type = SHORTCUTS[beforeText];
				//console.log(type)
				if (type) {
					//Transforms.select(editor, range)

					// if (!Range.isCollapsed(range)) {
					//   Transforms.delete(editor)
					// }

					const newProperties: Partial<Element> = {
						type,
					};
					Transforms.setNodes<SlateElement>(editor, newProperties, {
						match: (n) => slateEditor.isBlock(editor, n),
					});

					// if (type === 'list-item') {
					//   const list: BulletedListElement = {
					//     type: 'bulleted-list',
					//     children: [],
					//   }
					//   Transforms.wrapNodes(editor, list, {
					//     match: n =>
					//       !slateEditor.isEditor(n) &&
					//       SlateElement.isElement(n) &&
					//       n.type === 'list-item',
					//   })
					// }

					// return
					//get the new block
					const newBlock = slateEditor.above(editor, {
						match: (n) => slateEditor.isBlock(editor, n),
					});

					// console.log("SETTING OLD BLOCK");
					// if (newBlock && newBlock[1].type !== "paragraph") {
					// 	console.log("old block type" + newBlock[1].type);
					// 	setOldBlock(newBlock);
					// }
				}
			}

			insertText(text);
      updateNodeType();
		};

		// editor.isInline = element => {
		//   //return if the element is currently selected

		//     const [match] = slateEditor.nodes(editor, {
		//       match: n => n === element,
		//     })
		//     if (match && element.type === 'heading-one') {
		//       console.log(match)
		//       return true
		//     }

		//   console.log("INLINE" + element.type)
		//   return false
		// }

		editor.deleteBackward = (...args: any) => {
			const { selection } = editor;

			if (selection && Range.isCollapsed(selection)) {
				const match = slateEditor.above(editor, {
					match: (n) => slateEditor.isBlock(editor, n),
				});

				if (match) {
					const [block, path] = match;
					const start = slateEditor.start(editor, path);

					// if (
					// 	!slateEditor.isEditor(block) &&
					// 	SlateElement.isElement(block) &&
					// 	block.type !== "paragraph" &&
					// 	Point.equals(selection.anchor, start)
					// ) {
					// 	// if(block.type === 'heading-six') {
					// 	//   const newProperties: Partial<Element> = {
					// 	//     type: 'heading-five',
					// 	//   }
					// 	//   Transforms.setNodes(editor, newProperties)
					// 	// } else if(block.type === 'heading-five') {
					// 	//   const newProperties: Partial<Element> = {
					// 	//     type: 'heading-four',
					// 	//   }
					// 	//   Transforms.setNodes(editor, newProperties)
					// 	// } else if(block.type === 'heading-four') {
					// 	//   const newProperties: Partial<Element> = {
					// 	//     type: 'heading-three',
					// 	//   }
					// 	//   Transforms.setNodes(editor, newProperties)
					// 	// } else if(block.type === 'heading-three') {
					// 	//   const newProperties: Partial<Element> = {
					// 	//     type: 'heading-two',
					// 	//   }
					// 	//   Transforms.setNodes(editor, newProperties)
					// 	// }else if (block.type === 'heading-two') {
					// 	//   const newProperties: Partial<Element> = {
					// 	//     type: 'heading-one',
					// 	//   }
					// 	//   Transforms.setNodes(editor, newProperties)
					// 	// }
					// 	// else {
					// 	const newProperties: Partial<Element> = {
					// 		type: "paragraph",
					// 	};

					// 	Transforms.setNodes(editor, newProperties);
					// 	//}

					// 	if (block.type === "list-item") {
					// 		Transforms.unwrapNodes(editor, {
					// 			match: (n) =>
					// 				!slateEditor.isEditor(n) &&
					// 				SlateElement.isElement(n) &&
					// 				n.type === "bulleted-list",
					// 			split: true,
					// 		});
					// 	}

					// 	return;
					// }
				}
        //get current cursor position
        const cursorPosition = editor.selection.anchor.offset;
				deleteBackward(...args);
        if(cursorPosition !== 0) {
				  updateNodeType();
        }
			}
		};

		return editor;
	};

	const Element = ({ attributes, children, element }) => {
		switch (element.type) {
			case "block-quote":
				return <blockquote {...attributes}>{children}</blockquote>;
			case "bulleted-list":
				return <ul {...attributes}>{children}</ul>;
			case "heading-one":
				return<h1  {...attributes}>{children}</h1>;
			case "heading-two":
				return <h2 {...attributes}>{children}</h2>;
			case "heading-three":
				return <h3 {...attributes}>{children}</h3>;
			case "heading-four":
				return <h4 {...attributes}>{children}</h4>;
			case "heading-five":
				return <h5 {...attributes}>{children}</h5>;
			case "heading-six":
				return <h6 {...attributes}>{children}</h6>;
			case "list-item":
				return <li {...attributes}>{children}</li>;
			default:
				return <p {...attributes}>{children}</p>;
		}
	};

	const renderElement = useCallback(
		(
			props: JSX.IntrinsicAttributes & {
				attributes: any;
				children: any;
				element: any;
			}
		) => <Element {...props} />,
		[]
	);
	const editor = useMemo(
		() => withShortcuts(withReact(withHistory(createEditor()))),
		[]
	);

	const onDOMBeforeInput = useCallback((e: InputEvent) => {
		queueMicrotask(() => {
			const pendingDiffs = ReactEditor.androidPendingDiffs(editor);

			const scheduleFlush = pendingDiffs?.some(({ diff, path }) => {
				if (!diff.text.endsWith(" ")) {
					return false;
				}

				const { text } = Node.leaf(editor, path);
				const beforeText = text.slice(0, diff.start) + diff.text.slice(0, -1);
				if (!(beforeText in SHORTCUTS)) {
					return;
				}

				const blockEntry = slateEditor.above(editor, {
					at: path,
					match: (n) => slateEditor.isBlock(editor, n),
				});
				if (!blockEntry) {
					return false;
				}

				const [, blockPath] = blockEntry;
				return slateEditor.isStart(
					editor,
					slateEditor.start(editor, path),
					blockPath
				);
			});

			if (scheduleFlush) {
				ReactEditor.androidScheduleFlush(editor);
			}
		});
	}, []);

	return (
		<Slate editor={editor} value={initialValue}>
			<Editable
				onDOMBeforeInput={onDOMBeforeInput}
				renderElement={renderElement}
				placeholder="Write some markdown..."
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						// //get the last block from the editor
						// const lastBlock = editor.children[editor.children.length - 1];
						// //get the last block type
						// const lastBlockType = lastBlock.type;
						// //if the last block type is a list item
						// if (lastBlockType === "list-item") {
						// 	if (lastBlock.children[0].text === "") {
						// 		event.preventDefault();
						// 		//change the type of the last block to paragraph
						// 		Transforms.setNodes(editor, { type: "paragraph" });
						// 		return;
						// 	}

						// 	return;
						// } else if (!event.shiftKey) {
						// 	event.preventDefault();
						// 	const newLine = {
						// 		type: "paragraph",
						// 		children: [
						// 			{
						// 				text: "",
						// 				marks: [],
						// 			},
						// 		],
						// 	};
						// 	Transforms.insertNodes(editor, newLine);
						// }
            
					}
				}}
				onKeyUp={(event) => {
          
				
          if (event.key === "Enter") {
            updateNodeType()
          }
          if (
						event.key === "ArrowUp" ||
						event.key === "ArrowDown" ||
						event.key === "Enter" ||
            event.key === "Backspace"
					) {
						console.log("arrow up or down");
						updateDisplay();
					}

          
				}}
				onMouseUp={(event) => {
					updateDisplay();
				}}
				spellCheck
				autoFocus
			/>
		</Slate>
	);
};
