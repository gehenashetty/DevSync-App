import React from "react";
import styles from "./Documentation.module.css";
import { ChevronRight, Search, Home } from "lucide-react";

const Header = ({ spaces, selectedSpace, setSelectedSpace, search, setSearch }) => {
  const selectedSpaceObj = spaces.find(s => s.key === selectedSpace);
  return (
    <header className={styles.header}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <span className={styles.breadcrumbHome} onClick={() => setSelectedSpace("")}> <Home size={18} /> </span>
        <ChevronRight size={16} className={styles.breadcrumbChevron} />
        {selectedSpaceObj ? (
          <span className={styles.breadcrumbSpace}>{selectedSpaceObj.name}</span>
        ) : (
          <span className={styles.breadcrumbSpaceInactive}>Select a space</span>
        )}
      </nav>
      <div className={styles.headerSearchWrapper}>
        <Search size={18} className={styles.headerSearchIcon} />
        <input
          className={styles.headerSearch}
          type="text"
          placeholder="Search pages..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className={styles.headerActions}>
        {/* Add quick actions here, e.g., create page, refresh, etc. */}
      </div>
    </header>
  );
};

export default Header; 