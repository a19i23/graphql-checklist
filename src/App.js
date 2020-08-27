import React from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';

const GET_TODOS = gql`
  query MyQuery {
    todos {
      done
      id
      text
    }
  }
`;

const ADD_TODO = gql`
  mutation addTodo($text: String!) {
    insert_todos(objects: { text: $text }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

const DELETE_TODO = gql`
  mutation deleteTodo($id: uuid!) {
    delete_todos(where: { id: { _eq: $id } }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

const TOGGLE_TODO = gql`
  mutation toggleTodo($id: uuid!, $done: Boolean!) {
    update_todos(where: { id: { _eq: $id } }, _set: { done: $done }) {
      returning {
        done
        id
        text
      }
    }
  }
`;

// list todos
// add todos
// toggle todos
// delete todos

function App() {
  const [todoText, setTodoText] = React.useState('');
  const { data, loading, error } = useQuery(GET_TODOS);
  const [toggleTodo] = useMutation(TOGGLE_TODO);
  const [addTodo] = useMutation(ADD_TODO, { onCompleted: () => setTodoText('') });
  const [deleteTodo] = useMutation(DELETE_TODO);

  async function handleAddTodo(event) {
    event.preventDefault();
    if (!todoText.trim()) return;
    const data = await addTodo({
      variables: { text: todoText },
      refetchQueries: [{ query: GET_TODOS }],
    });
    console.log('added todo', data);
  }

  async function handleDeleteTodo(id) {
    const isConfirmed = window.confirm('Do you really want to delete this?');
    if (isConfirmed) {
      const data = await deleteTodo({
        variables: { id },
        update: (cache) => {
          const prevData = cache.readQuery({ query: GET_TODOS });
          const newTodos = prevData.todos.filter((todo) => todo.id !== id);
          cache.writeQuery({ query: GET_TODOS, data: { todos: newTodos } });
        },
      });
      console.log('deleted todo', data);
    }
  }

  async function handleToggleTodo({ id, done }) {
    const data = await toggleTodo({ variables: { id, done: !done } });
    console.log('toggled todo', data);
  }

  if (error) return <div>error fetching todos</div>;
  if (loading) return <div>loading...</div>;
  return (
    <div className="vh-100 code flex flex-column items-center bg-purple white pa3 fl-1">
      <h1 className="f2-l">
        GraphQL Checklist{' '}
        <span role="img" aria-label="Checkmark">
          ✅
        </span>
      </h1>

      {/* Todo Form */}
      <form className="mb3" onSubmit={handleAddTodo}>
        <input
          onChange={(event) => setTodoText(event.target.value)}
          className="pa2 f4 b--dashed"
          type="text"
          placeholder="Write your todo"
          value={todoText}
        />
        <button className="pa2 f4 bg-green" type="submit">
          Create
        </button>
      </form>
      {/* Todo list */}
      <div className="flex items-center justify-center flex-column">
        {data.todos.map((todo) => (
          <p onDoubleClick={() => handleToggleTodo(todo)} key={todo.id}>
            <span className={`pointer list pa1 f3 ${todo.done && 'strike'}`}>{todo.text}</span>
            <button onClick={() => handleDeleteTodo(todo.id)} className="bg-transparent bn f4 ">
              <span className="red">&times;</span>
            </button>
          </p>
        ))}
      </div>
    </div>
  );
}

export default App;
