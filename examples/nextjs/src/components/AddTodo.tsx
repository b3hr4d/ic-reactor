import React, { useState } from "react"
import { useUpdateTodo } from "service/todo"

interface AddTodoProps {}

const AddTodo: React.FC<AddTodoProps> = () => {
  const { call, error, loading } = useUpdateTodo({
    functionName: "addTodo"
  })

  const [todo, setTodo] = useState("")

  return (
    <div>
      <section>
        <h2>AddTodo</h2>
        <label htmlFor="todo">Todo:</label>
        <input
          id="todo"
          alt="Name"
          type="text"
          value={todo}
          onChange={e => setTodo(e.target.value)}
        />
        <button onClick={() => call([todo])}>Save</button>
      </section>
      <section>
        <label>Response: &nbsp;</label>
        {loading ? <span>Loading...</span> : null}
        {error ? <span>Error: {JSON.stringify(error)}</span> : null}
      </section>
    </div>
  )
}

export default AddTodo
