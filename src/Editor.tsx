import CodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { sublime } from '@uiw/codemirror-theme-sublime';
import { EditorView, keymap, highlightActiveLine } from '@codemirror/view'
import { HighlightStyle, tags } from '@codemirror/highlight';

function Editor(props: any) {

return (
    <CodeMirror
    value={props.currentFileContent}
    onChange={props.onChange}
    height='100%'
    width='100%'
    theme={sublime}
    extensions={[
      //syntaxHighlighting,
      EditorView.lineWrapping,
      markdown({ base: markdownLanguage, codeLanguages: languages }
      )]}
    className="h-full  max-w-[700px] m-auto flex   bg-zinc-700 place-self-center"
    id='codeMirror'
  >
    {/* <div id="EditorResizeBar" className={showFileLeaf ? "w-1  bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50" : " rounded-tl-2xl w-1 float-right  h-full bg-zinc-700 hover:bg-sky-400 cursor-col-resize ease-in-out duration-300 delay-50"}></div> */}
  </CodeMirror>
)
}

export default Editor;