import CodeMirror, { useCodeMirror } from "@uiw/react-codemirror";
import { tags as t } from "@lezer/highlight";
import { HighlightStyle, indentOnInput } from "@codemirror/language";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { history } from "@codemirror/commands";
import { createTheme } from "@uiw/codemirror-themes";
import { createRef, useEffect, useRef, useState,useImperativeHandle  } from "react";
import { EditorState } from "@codemirror/state";
import {basicSetup, EditorView} from "codemirror"
import {ReactCodeMirrorRef } from "@uiw/react-codemirror";
export const transparentTheme = EditorView.theme(
	{
		"&": {
			backgroundColor: "transparent !important",
			height: "100%",
			font: "17px 'arial', monospace",
			color: "white",
		},
		".cm-content": {
			caretColor: "#0e9",
		},
		"&.cm-focused .cm-cursor": {
			borderLeftColor: "#0e9",
		},
		"&.cm-focused .cm-selectionBackground, ::selection": {
			backgroundColor: "#074",
		},
		".cm-gutters": {
			backgroundColor: "#045",
			color: "#ddd",
			border: "none",
		},
	},
	{ dark: true }
);

const myTheme = createTheme({
	theme: "light",
	settings: {	
		background: "transparent !important",
		foreground: "#ddd",
		caret: "#0e9",
		selection: "#036dd626",
		selectionMatch: "#686337",
		lineHighlight: "#8a91991a",
		gutterBackground: "transparent !important",
		gutterForeground: "#ddd",
		gutterBorder: "transparent !important",
	},
	styles: [
		{
			tag: t.heading1,
			fontSize: "1.6em",
			fontWeight: "bold",
		},
		{
			tag: t.heading2,
			fontSize: "1.4em",
			fontWeight: "bold",
		},
		{
			tag: t.heading3,
			fontSize: "1.2em",
			fontWeight: "bold",
		},
	],
});

const syntaxHighlighting = HighlightStyle.define([
	{
		tag: t.heading1,
		fontSize: "1.6em",
		fontWeight: "bold",
	},
	{
		tag: t.heading2,
		fontSize: "1.4em",
		fontWeight: "bold",
	},
	{
		tag: t.heading3,
		fontSize: "1.2em",
		fontWeight: "bold",
	},
]);

function Editor(props: any) {
	const [editorState, setEditorState] = useState<EditorState>(undefined)

	useEffect(() => {
	
		
	}, [props.currentFileContent])

	return (
		<CodeMirror
			value={props.currentFileContent}
			onChange={props.onChange}
			width="100%"

			onCreateEditor={(editor: any) => {
				console.log(editor.viewState.state);
				setEditorState(editor.viewState.state)
			}}
			extensions={[
				history(),
				indentOnInput(),
				myTheme,
				EditorView.lineWrapping,
				markdown({ base: markdownLanguage, codeLanguages: languages }),
			]}
			className="h-full border-white border-10 focus:border-10 outline-10 active:outline-10  max-w-[700px] m-auto flex   outline-white  bg-zinc-700 place-self-center"
			id="codeMirror"
		></CodeMirror>

	);
}

export default Editor;
