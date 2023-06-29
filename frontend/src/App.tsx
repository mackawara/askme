import { FormEvent, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");

  function handleChange(e: any) {
    console.log(e.value);
    setQuery(e.value);
    console.log(query);
  }

  /* function handleSubmit(event: any) {
    event.preventDefault();

    // Access the form data here
    console.log(formData);

    // Perform additional actions or validations
  } */

  return (
    <>
      <form action="">
        <label htmlFor="query">Try Askme</label>
        <input
          id="query"
          name="query"
          type="text"
          onChange={(e: any) => handleChange(e)}
        />
        <button type="submit">Submit Query</button>
      </form>
      {/* <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a> dx2330 master roll 78A 305
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </>
  );
}

export default App;
