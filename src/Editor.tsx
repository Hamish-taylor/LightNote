import CodeMirror from "@uiw/react-codemirror";
import { tags as t } from "@lezer/highlight";
import { indentOnInput } from "@codemirror/language";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { history } from "@codemirror/commands";
import { createTheme } from "@uiw/codemirror-themes";
import { useEffect, useState } from "react";
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
		foreground: "#ffffff",
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
		{
			tag: t.emphasis,
			fontStyle: "italic",
		},
		{
			tag: t.strong,
			fontWeight: "bold",
		},
	],
});

import { EditorState, StateEffect, StateField } from "@codemirror/state";
import { Decoration, ViewUpdate } from "@codemirror/view";
import { SearchCursor } from "@codemirror/search";

// code mirror effect that you will use to define the effect you want (the decoration)
const highlight_effect = StateEffect.define();
const remove_highlight_effect = StateEffect.define();

// define a new field that will be attached to your view state as an extension, update will be called at each editor's change
const highlight_extension = StateField.define({
	create() {
		return Decoration.none;
	},
	update(value, transaction) {
		value = value.map(transaction.changes);

		for (let effect of transaction.effects) {
			if (effect.is(highlight_effect)) {
				value = value.update({ add: effect.value!, sort: true });
			} else if(effect.is(remove_highlight_effect)) {
				value = value.update({
					filter: (f, t, value) => value.spec.class === "remove_highlight"
				  });
			}
		}

		return value;
	},
	provide: (f) => EditorView.decorations.from(f),
});

// this is your decoration where you can define the change you want : a css class or directly css attributes
const highlight_decoration = Decoration.mark({
	attributes: { style: "background-color: red" },
});

// const remove_highlight_decoration = Decoration.mark({
// 	class: 'remove_highlight',
// });

function Editor(props: any) {
	const width = () => {
		const width = parseInt(props.settings.editorWidth.value).toString() + "px";
		return width;
	};

	// the import for SearchCursor class
	const [view, setView] = useState<EditorView>();

	useEffect(() => {}, [props.currentFileContent]);

	const highlight = (view: EditorView) => {
		let cursor = new SearchCursor(view.state.doc, "blockchain");
		console.log(view.state.doc.toString());
		// will search the first match of the string element.outerHTML in the editor view main_view.state.doc
		// cursor.next();
		view.dispatch({
			effects: remove_highlight_effect.of(null),
		});
		while (cursor.done == false) {
		cursor.next()
			if (cursor.value.from < cursor.value.to) {
				view.dispatch({
					effects: highlight_effect.of(
						highlight_decoration.range(cursor.value.from, cursor.value.to) as any
					),
				});
			}
		}

	}


	const onChange = (value: any, viewUpdate: ViewUpdate) => {
		// will create a cursor based on the doc content and the DOM element as a string (outerHTML)
		highlight(viewUpdate.view);
		props.onChange(value);
	};

	const onCreateEditor = (view: EditorView, state: EditorState) => {
		console.log("wow");
		highlight(view);
	};
	return (
		<CodeMirror
			value={props.currentFileContent}
			onChange={onChange}
			onCreateEditor={onCreateEditor}
			width="100%"
			extensions={[
				history({ newGroupDelay: 500 }),
				indentOnInput(),
				myTheme,
				EditorView.lineWrapping,
				highlight_extension,
				markdown({ base: markdownLanguage, codeLanguages: languages }),
			]}
			className="h-full border-white border-10 focus:border-10 outline-10 active:outline-10   m-auto flex   outline-white  bg-zinc-700 place-self-center"
			style={{ maxWidth: width() }}
			id="codeMirror"
		></CodeMirror>
	);
}

export default Editor;
