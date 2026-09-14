import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { Workspace } from "./components/Workspace";

export default function App() {
  const [inApp, setInApp] = useState(() => window.location.hash === "#app");
  useEffect(() => {
    const onHash = () => setInApp(window.location.hash === "#app");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const launch = () => { window.location.hash = "app"; setInApp(true); };
  const home = () => { window.location.hash = ""; setInApp(false); };
  return <div className="min-h-screen bg-ink text-gray-100"><Header inApp={inApp} onHome={home} onLaunch={launch} />{inApp ? <Workspace /> : <LandingPage onLaunch={launch} />}</div>;
}
