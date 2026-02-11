"use client";

import { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabaseClient";

export default function Home() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      setStatus(error ? `error: ${error.message}` : `ok. session: ${data.session ? "yes" : "no"}`);
    })();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Budget Tool</h1>
      <p>Supabase: {status}</p>
    </main>
  );
}
