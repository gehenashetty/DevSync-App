import { useState } from "react";
import "./CreateJiraTicketForm.css"; // 💡 link to our CSS file

export default function CreateJiraTicketForm({ onTicketCreated }) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const response = await fetch("http://localhost:5000/api/jira/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description,
        projectKey: "MBA", // Replace with your actual key
      }),
    });

    const result = await response.json();
    setLoading(false);

    if (result.success) {
      setStatus(`✅ Ticket Created: ${result.issueKey}`);
      setSummary("");
      setDescription("");
      if (onTicketCreated) onTicketCreated();
    } else {
      setStatus("❌ Failed to create ticket.");
      console.error(result);
    }
  };

  return (
    <div className="jira-form-container">
      <h2>Create Jira Ticket</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Enter issue summary"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter issue description"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Ticket"}
        </button>
        {status && <p className="jira-status">{status}</p>}
      </form>
    </div>
  );
}
