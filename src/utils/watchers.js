// @flow
import database from 'utils/database';
import { deleteListSuccess, readListItemsSuccess, renameListSuccess } from 'redux/list';

export const bindWatchers = (listId: string, dispatch: Function): void => {
  // List renamed.
  database.ref(`/lists/${listId}/name`).on('value', nameRef => {
    dispatch(renameListSuccess(nameRef.val()));
  });

  // List removed.
  database.ref('/lists').orderByKey().equalTo(listId).on('child_removed', () => {
    dispatch(deleteListSuccess());

    // Remove all list items also.
    database.ref(`/items/${listId}`).remove();
  });

  // List item updates.
  database.ref(`/items/${listId}`).orderByChild('index').on('value', itemsRef => {
    const items = [];
    itemsRef.forEach(item => {
      items.push({
        ...item.val(),
        id: item.key,
      });
    });

    dispatch(readListItemsSuccess(items));
  });
};

export const removeWatchers = () => {
  database.ref('/lists').off();
  database.ref('/items').off();
};
