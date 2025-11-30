import NavBar from "../components/NavBar";

export default function AdminLayout({ children }) {
  return (
    <>
      <NavBar />
      <main className="app-main">{children}</main>
    </>
  );
}
