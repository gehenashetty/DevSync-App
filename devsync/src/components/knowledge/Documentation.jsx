import React, { useState, useEffect } from "react";
import Sidebar from "./documentation/Sidebar";
import Header from "./documentation/Header";
import PageList from "./documentation/PageList";
import styles from "./documentation/Documentation.module.css";
import ConfluenceService from '../../services/ConfluenceService';
import Card from "../ui/Card";
import Button from "../ui/Button";
import { Plus } from "lucide-react";

const Documentation = () => {
  const [spaces, setSpaces] = useState([]);
  const [selectedSpace, setSelectedSpace] = useState("");
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    ConfluenceService.fetchSpaces()
      .then(data => {
        setSpaces(data.results || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch Confluence spaces");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedSpace) return;
    setLoading(true);
    ConfluenceService.fetchPages(selectedSpace)
      .then(data => {
        setPages(data.results || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch pages");
        setLoading(false);
      });
  }, [selectedSpace]);

  return (
    <div className={styles.docRoot + " w-full h-full p-4"}>
      <Sidebar
        spaces={spaces}
        selectedSpace={selectedSpace}
        setSelectedSpace={setSelectedSpace}
        search={search}
        setSearch={setSearch}
        loading={loading}
      />
      <main className={styles.docMain + " flex-1 flex flex-col items-center justify-start"}>
        <Card className="w-full max-w-3xl bg-background-lighter border border-accent-blue/30 rounded-2xl shadow-xl p-0 overflow-hidden relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 pt-6 pb-2 border-b border-accent-blue/10 bg-white/80">
            <Header
              spaces={spaces}
              selectedSpace={selectedSpace}
              setSelectedSpace={setSelectedSpace}
              search={search}
              setSearch={setSearch}
            />
            <Button
              variant="primary"
              size="icon"
              className="ml-auto mt-2 sm:mt-0"
              aria-label="Create new page"
              // onClick={...} // TODO: hook up create page modal
            >
              <Plus size={22} />
            </Button>
          </div>
          <div className="p-6">
            <PageList
              pages={pages}
              loading={loading}
              error={error}
              search={search}
            />
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Documentation; 