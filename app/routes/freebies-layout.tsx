import { Outlet, useLocation } from "react-router";
import { Nav } from "~/components/Nav";
import { Footer } from "~/components/Footer";
import { Breadcrumb } from "~/components/Breadcrumb";
import { FreebiesTabs } from "~/components/FreebiesTabs";

export default function FreebiesLayout() {
  const { pathname } = useLocation();
  // The hub page is itself the category switcher, so it skips both.
  const isHub = pathname === "/freebies";

  return (
    <>
      <Nav />
      {!isHub && (
        <div className="wrap" style={{ paddingTop: 20 }}>
          <Breadcrumb />
          <FreebiesTabs />
        </div>
      )}
      <Outlet />
      <Footer />
    </>
  );
}
