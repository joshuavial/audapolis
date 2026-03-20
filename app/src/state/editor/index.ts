import { defaultEditorState, EditorState } from './types';
import { AnyAction, Reducer } from '@reduxjs/toolkit';
import { produce } from 'immer';
import { ActionWithReducers, AsyncActionWithReducers, exposeReducersWindow } from '../util';
import undoable, { includeAction, StateWithHistory } from 'redux-undo';
import {
  deleteSelection,
  insertParagraphEnd,
  paste,
  reassignParagraph,
  renameSpeaker,
  deleteSomething,
  filterContent,
} from './edit';

import { finishTranscriptCorrection } from './transcript_correction';

import * as displayReducers from './display';
import * as editReducers from './edit';
import * as ioReducers from './io';
import * as playReducers from './play';
import * as selectionReducers from './selection';
import * as transcriptCorrectionReducers from './transcript_correction';
import { memoizedLintDocumentContent } from '../../util/document_linter';

exposeReducersWindow(displayReducers, editReducers, ioReducers, playReducers, selectionReducers);

export const reducers: (
  | ActionWithReducers<EditorState, any>
  | AsyncActionWithReducers<EditorState, any, any>
)[] = [
  ...Object.values(displayReducers),
  ...Object.values(editReducers),
  ...Object.values(ioReducers),
  ...Object.values(playReducers),
  ...Object.values(selectionReducers),
  ...Object.values(transcriptCorrectionReducers),
];

function editorReducer(state: EditorState | undefined, action: AnyAction): EditorState {
  if (!state) {
    return defaultEditorState;
  }

  return produce(state, (draft) => {
    reducers.forEach((reducer) => {
      reducer.handleAction(draft, action);
    });
    const lintResult = memoizedLintDocumentContent(draft.document.content);
    if (!lintResult.pass) {
      const firstBrokenIndex = draft.document.content.findIndex((item, idx, content) => {
        if (idx === 0) {
          return item.type !== 'paragraph_start';
        }
        const prev = content[idx - 1];
        return prev.type !== 'paragraph_end' && item.type === 'paragraph_start';
      });
      const context = draft.document.content
        .slice(Math.max(0, firstBrokenIndex - 3), Math.max(0, firstBrokenIndex - 3) + 8)
        .map((item) => item.type);
      console.error(
        'DOCUMENT LINTING FAILED!',
        lintResult.message(),
        'action=',
        action.type,
        'index=',
        firstBrokenIndex,
        'context=',
        context.join(', ')
      );
    }
  });
}

const stateSlice: Reducer<StateWithHistory<EditorState | null>> = undoable(editorReducer, {
  filter: includeAction([
    insertParagraphEnd.type,
    deleteSelection.type,
    deleteSomething.type,
    reassignParagraph.type,
    renameSpeaker.type,
    paste.fulfilled.type,
    finishTranscriptCorrection.type,
    filterContent.type,
  ]),
  ignoreInitialState: false,
  syncFilter: true,
});
export default stateSlice;
