import React from "react";
import styles from "./Documentation.module.css";
import { BookOpen } from "lucide-react";

const Sidebar = ({ spaces, selectedSpace, setSelectedSpace, search, setSearch, loading }) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <BookOpen size={28} className={styles.sidebarIcon} />
        <span className={styles.sidebarTitle}>Spaces</span>
      </div>
      <input
        className={styles.spaceSearch}
        type="text"
        placeholder="Search spaces..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        disabled={loading}
      />
      <div className={styles.spaceListWrapper}>
        {loading ? (
          <div className={styles.loadingAnim}>Loading spaces...</div>
        ) : (
          <ul className={styles.spaceList}>
            {spaces
              .filter(space =>
                space.name.toLowerCase().includes(search.toLowerCase()) ||
                space.key.toLowerCase().includes(search.toLowerCase())
              )
              .map(space => (
                <li
                  key={space.id}
                  className={
                    styles.spaceItem +
                    (selectedSpace === space.key ? ' ' + styles.spaceItemActive : '')
                  }
                  onClick={() => setSelectedSpace(space.key)}
                  tabIndex={0}
                  aria-label={`Select space ${space.name}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter') setSelectedSpace(space.key);
                  }}
                >
                  <span className={styles.spaceIcon}><BookOpen size={18} /></span>
                  <span className={styles.spaceName}>{space.name}</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 