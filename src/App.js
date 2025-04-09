import React from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import PromptSelector from "./pages/Prompt/Prompts"; // путь к твоему компоненту

const darkTheme = createTheme({
    palette: {
        mode: "dark",
    },
});


function App() {
  return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <PromptSelector />
      </ThemeProvider>
  );
}

export default App;
