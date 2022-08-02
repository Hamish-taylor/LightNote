import CodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { createTheme } from '@uiw/codemirror-themes';
import { sublime } from '@uiw/codemirror-theme-sublime';
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight';
import { HighlightStyle } from '@codemirror/highlight';
import { indentOnInput } from '@codemirror/language'

export const transparentTheme = EditorView.theme({
  "&": {
    backgroundColor: 'transparent !important',
    height: '100%',
    font: "17px 'arial', monospace",
    color: "white",
  },
  ".cm-content": {
    caretColor: "#0e9"
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#0e9"
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "#074"
  },
  ".cm-gutters": {
    backgroundColor: "#045",
    color: "#ddd",
    border: "none"
  }
}, {dark: true})

const myTheme = createTheme({
  theme: 'light',
  settings: {
    background: 'transparent !important',
    foreground: '#ddd',
    caret: '#0e9',
    selection: '#036dd626',
    selectionMatch: '#686337',
    lineHighlight: '#8a91991a',
    gutterBackground: 'transparent !important',
    gutterForeground: '#ddd',
    gutterBorder: 'transparent !important',
  },
  styles: [
    {
      tag: t.heading1,
      fontSize: '1.6em',
      fontWeight: 'bold'
    },
    {
      tag: t.heading2,
      fontSize: '1.4em',
      fontWeight: 'bold'
    },
    {
      tag: t.heading3,
      fontSize: '1.2em',
      fontWeight: 'bold'
    }
    // { tag: t.comment, color: '#787b8099' },
    // { tag: t.variableName, color: '#0080ff' },
    // { tag: [t.string, t.special(t.brace)], color: '#5c6166' },
    // { tag: t.number, color: '#5c6166' },
    // { tag: t.bool, color: '#5c6166' },
    // { tag: t.null, color: '#5c6166' },
    // { tag: t.keyword, color: '#5c6166' },
    // { tag: t.operator, color: '#5c6166' },
    // { tag: t.className, color: '#5c6166' },
    // { tag: t.definition(t.typeName), color: '#5c6166' },
    // { tag: t.typeName, color: '#5c6166' },
    // { tag: t.angleBracket, color: '#5c6166' },
    // { tag: t.tagName, color: '#5c6166' },
    // { tag: t.attributeName, color: '#5c6166' },
  ],
});

const syntaxHighlighting = HighlightStyle.define([
  {
    tag: t.heading1,
    fontSize: '1.6em',
    fontWeight: 'bold'
  },
  {
    tag: t.heading2,
    fontSize: '1.4em',
    fontWeight: 'bold'
  },
  {
    tag: t.heading3,
    fontSize: '1.2em',
    fontWeight: 'bold'
  }
])

function Editor(props: any) {


  
return (
    <CodeMirror
    value={props.currentFileContent}
    onChange={props.onChange}
    height='100%'
    width='100%'

    extensions={[  
      indentOnInput(),
      myTheme,
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage, codeLanguages: languages }
      )]}
    className="h-full  max-w-[700px] m-auto flex   bg-zinc-700 place-self-center"
    id='codeMirror'
  >
 </CodeMirror>
)
}

export default Editor;