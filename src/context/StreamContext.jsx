import { createContext, useContext, useState } from "react";

const StreamContext = createContext(null);

export function StreamProvider({ children }) {
  const [status, setStatus] = useState({ playing: false, offline: false, loading: false });
  return (
    <StreamContext.Provider value={{ ...status, setStatus }}>
      {children}
    </StreamContext.Provider>
  );
}

export function useStream() {
  const ctx = useContext(StreamContext);
  if (!ctx) throw new Error("useStream must be used within StreamProvider");
  return ctx;
}
