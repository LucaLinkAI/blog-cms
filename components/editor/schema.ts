/**
 * Shared BlockNote schema used by both BlockEditor (client) and
 * BlockRenderer (server). Extends the default block specs with three
 * custom blocks: Callout, Blockquote, and Divider.
 *
 * createReactBlockSpec returns a factory — call it with no args to get BlockSpec.
 */
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { BlockquoteBlock } from "./blocks/BlockquoteBlock";
import { DividerBlock } from "./blocks/DividerBlock";

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    callout: CalloutBlock(),
    blockquote: BlockquoteBlock(),
    divider: DividerBlock(),
  },
});

export type EditorSchema = typeof schema;
