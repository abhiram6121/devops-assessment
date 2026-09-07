import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header-inner">
                    <span className="app-title">
                        DevOps Assessment Dashboard
                    </span>
                    <nav className="app-nav">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                isActive ? "nav-link active" : "nav-link"
                            }
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/items"
                            className={({ isActive }) =>
                                isActive ? "nav-link active" : "nav-link"
                            }
                        >
                            Items
                        </NavLink>
                        <NavLink
                            to="/files"
                            className={({ isActive }) =>
                                isActive ? "nav-link active" : "nav-link"
                            }
                        >
                            Files
                        </NavLink>
                    </nav>
                </div>
            </header>
            <main className="app-main">{children}</main>
        </div>
    );
}
