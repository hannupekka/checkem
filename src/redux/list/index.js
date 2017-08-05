// @flow
import { Observable, Action } from 'rxjs';
// import cuid from 'cuid';
import { push } from 'react-router-redux'
import database from 'utils/database';
import { hideConfirmation } from 'redux/confirm';
import { showNotification } from 'redux/notification';

export const CREATE_LIST = 'cocheck/list/CREATE_LIST';
export const CREATE_LIST_SUCCESS = 'cocheck/list/CREATE_LIST_SUCCESS';
export const CREATE_LIST_FAILURE = 'cocheck/list/CREATE_LIST_FAILURE';

export const READ_LIST = 'cocheck/list/READ_LIST';
export const READ_LIST_SUCCESS = 'cocheck/list/READ_LIST_SUCCESS';
export const READ_LIST_FAILURE = 'cocheck/list/READ_LIST_FAILURE';

export const DELETE_LIST = 'cocheck/list/DELETE_LIST';
export const DELETE_LIST_SUCCESS = 'cocheck/list/DELETE_LIST_SUCCESS';
export const DELETE_LIST_FAILURE = 'cocheck/list/DELETE_LIST_FAILURE';

export const HANDLE_ERROR = 'cocheck/list/HANDLE_ERROR';

// export const ADD_ITEM = 'cocheck/list/ADD_ITEM';
// export const EDIT_ITEM = 'cocheck/list/EDIT_ITEM';
// export const CHECK_ITEM = 'cocheck/list/CHECK_ITEM';
// export const UNCHECK_ITEM = 'cocheck/list/UNCHECK_ITEM';
// export const REMOVE_ITEM = 'cocheck/list/REMOVE_ITEM';

// export const CHECK_ALL = 'cocheck/list/CHECK_ALL';
// export const UNCHECK_ALL = 'cocheck/list/UNCHECK_ALL';

export const createList = (): ThunkAction => ({
  type: CREATE_LIST,
  payload: {},
});

export const createListSuccess = (id: string): ThunkAction => ({
  type: CREATE_LIST_SUCCESS,
  payload: {
    id,
  },
});

export const createListFailure = (): ThunkAction => ({
  type: CREATE_LIST_FAILURE,
  payload: {},
});

export const readList = (id: string): ThunkAction => ({
  type: READ_LIST,
  payload: {
    id,
  },
});

export const readListSuccess = (id: string): ThunkAction => ({
  type: READ_LIST_SUCCESS,
  payload: {
    id,
  },
});

export const readListFailure = (): ThunkAction => ({
  type: READ_LIST_FAILURE,
  payload: {},
});

export const deleteList = (id: string): ThunkAction => ({
  type: DELETE_LIST,
  payload: {
    id,
  },
});

export const deleteListSuccess = (): ThunkAction => ({
  type: DELETE_LIST_SUCCESS,
  payload: {},
});

export const deleteListFailure = (): ThunkAction => ({
  type: DELETE_LIST_FAILURE,
  payload: {},
});

// export const addItem = ({ name, checked }: { name: string, checked: boolean }): ThunkAction => ({
//   type: ADD_ITEM,
//   payload: {
//     id: cuid(),
//     name,
//     checked,
//   },
// });

// export const editItem = (name: string): ThunkAction => ({
//   type: EDIT_ITEM,
//   payload: {
//     name,
//   },
// });

// export const checkItem = (id: string): ThunkAction => ({
//   type: CHECK_ITEM,
//   payload: {
//     id,
//   },
// });

// export const uncheckItem = (id: string): ThunkAction => ({
//   type: UNCHECK_ITEM,
//   payload: {
//     id,
//   },
// });

// export const removeItem = (id: string): ThunkAction => ({
//   type: REMOVE_ITEM,
//   payload: {
//     id,
//   },
// });

// export const checkAll = (): ThunkAction => ({
//   type: CHECK_ALL,
//   payload: {},
// });

// export const uncheckAll = (): ThunkAction => ({
//   type: UNCHECK_ALL,
//   payload: {},
// });

export const handleError = (error: Object): ThunkAction => ({
  type: HANDLE_ERROR,
  payload: error,
});

export const createListEpic =
  (action$: Observable<Action>): Observable<Action> =>
    action$.ofType(CREATE_LIST)
      .flatMap(() => {
        const listsRef = database.ref('/lists');
        const list = listsRef.push({ created: new Date().toISOString() });
        const id = list.ref.key;

        return Observable.concat(
          Observable.of(createListSuccess(id)),
          Observable.of(push(`/list/${id}`))
        );
      })
      .catch(error => Observable.of(handleError(error)));

export const readListEpic =
  (action$: Observable<Action>): Observable<Action> =>
    action$.ofType(READ_LIST)
      .flatMap(action => {
        const listRef = database.ref('/lists').child(action.payload.id);
        return Observable.fromPromise(listRef.once('value'));
      })
      .flatMap(snapshot => {
        const listExists = snapshot.val() !== null;
        return listExists
          ? Observable.of(readListSuccess(snapshot.key))
          : Observable.concat(
              Observable.of(readListFailure()),
              Observable.of(push('/')),
              Observable.of(showNotification({
                title: 'Error',
                body: 'List not found!',
                icon: 'exclamation',
                type: 'error',
              }))
          );
      })
      .catch(error => Observable.of(handleError(error)));

export const deleteListEpic =
  (action$: Observable<Action>): Observable<Action> =>
    action$.ofType(DELETE_LIST)
      .flatMap(action => {
        database.ref('/lists').child(action.payload.id).remove();

        return Observable.concat(
          Observable.of(hideConfirmation()),
          Observable.of(deleteListSuccess()),
          Observable.of(showNotification({
            title: 'OK',
            body: 'List deleted!',
            icon: 'trash',
            type: 'success',
          }))
        );
      })
      .catch(error => Observable.of(handleError(error)));

export const deleteListWatchEpic =
  (action$: Observable<Action>): Observable<Action> =>
    action$.ofType(DELETE_LIST_SUCCESS)
      .flatMap(() => Observable.of(push('/')))
      .catch(error => Observable.of(handleError(error)));

export const handleErrorEpic =
  (action$: Observable<Action>): Observable<Action> =>
    action$.ofType(HANDLE_ERROR)
      .flatMap(action => {
        // eslint-disable-next-line
        console.error(action.payload.message);
        return Observable.of(push('/'));
      });

export const initialState: ListState = {
  isLoading: false,
  id: '',
  entities: {
    items: {},
  },
  result: [],
};

export default function reducer(state: ListState = initialState, action: ThunkAction): ListState {
  switch (action.type) {
    case CREATE_LIST:
    case READ_LIST:
      return {
        ...initialState,
        isLoading: true,
      };
    case DELETE_LIST:
      return {
        ...state,
        isLoading: true,
      };
    case CREATE_LIST_SUCCESS:
    case READ_LIST_SUCCESS:
      return {
        ...initialState,
        id: action.payload.id,
      };
    case DELETE_LIST_SUCCESS:
    case CREATE_LIST_FAILURE:
    case READ_LIST_FAILURE:
    case HANDLE_ERROR:
      return initialState;
    case DELETE_LIST_FAILURE:
      return {
        ...state,
        isLoading: false,
      };
    default:
      return state;
  }
};
