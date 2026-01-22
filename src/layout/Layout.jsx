import { Outlet, Link } from "react-router-dom";

const Layout = () => {
  return (
    <div>
      <nav style={{ padding: "20px", background: "#f0f0f0" }}>
        <ul style={{ display: "flex", listStyle: "none", gap: "20px" }}>
          <li>
            <Link to="/">Atlas</Link>
          </li>
          <li>
            <Link to="/map-libre-map">Map Libre</Link>
          </li>
          <li>
            <Link to="/simple-map">SimpleMap</Link>
          </li>
        </ul>
      </nav>
      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
