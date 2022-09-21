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
    
  } from '@remirror/core';
  
  export interface SampOptions {}
  
  @extension<SampOptions>({ defaultOptions: {} })
  export class SampExtension extends MarkExtension<SampOptions> {
    get name() {
      return 'samp' as const;
    }
  
    createTags() {
      return [ExtensionTag.FormattingMark, ExtensionTag.FontStyle];
    }
  
    createMarkSpec(extra: ApplySchemaAttributes, override: MarkSpecOverride): MarkExtensionSpec {
      return {
        ...override,
        attrs: extra.defaults(),
        parseDOM: [
          {
            tag: 'samp',
            getAttrs: extra.parse,
          },
          ...(override.parseDOM ?? []),
        ],
        toDOM: (node) => {
          return ['samp', extra.dom(node), 0];
        },
      };

      
    }
    
    @command()
    toggleSamp(selection?: PrimitiveSelection): CommandFunction {
      return toggleMark({ type: this.type, selection });
    }
  
    @command()
    setSamp(selection?: PrimitiveSelection): CommandFunction {
      return ({ tr, dispatch }) => {
        const { from, to } = getTextSelection(selection ?? tr.selection, tr.doc);
        dispatch?.(tr.addMark(from, to, this.type.create()));
  
        return true;
      };
    }
  
    @command()
    removeSamp(selection?: PrimitiveSelection): CommandFunction {
      return ({ tr, dispatch }) => {
        const { from, to } = getTextSelection(selection ?? tr.selection, tr.doc);
  
        if (!tr.doc.rangeHasMark(from, to, this.type)) {
          return false;
        }
  
        dispatch?.(tr.removeMark(from, to, this.type));
  
        return true;
      };
    }

  }