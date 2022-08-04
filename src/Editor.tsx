import CodeMirror from "@uiw/react-codemirror";
import { tags as t } from "@lezer/highlight";
import { indentOnInput } from "@codemirror/language";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { history } from "@codemirror/commands";
import { createTheme } from "@uiw/codemirror-themes";
import { useEffect } from "react";
import { EditorView } from "codemirror";
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
		lineHighlight: "transparent !important",
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

function Editor(props: any) {
	const width = () => {
		const width = parseInt(props.settings.editorWidth.value).toString() + "px";
		return width;
	};

	useEffect(() => {}, [props.currentFileContent]);

	return (
		<CodeMirror
			value={props.currentFileContent}
			onChange={props.onChange}
			width="100%"
			extensions={[
				history({ newGroupDelay: 500 }),
				indentOnInput(),
				myTheme,
				EditorView.lineWrapping,
				markdown({ base: markdownLanguage, codeLanguages: languages }),
			]}
			className="h-full border-white border-10 focus:border-10 outline-10 active:outline-10   m-auto flex   outline-white  bg-zinc-700 place-self-center"
			style={{ maxWidth: width() }}
			id="codeMirror"
		></CodeMirror>
	);
}

export default Editor;
