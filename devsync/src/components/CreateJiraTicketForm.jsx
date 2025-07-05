<<<<<<< HEAD
import React, { useState } from "react";
import { motion } from "framer-motion";
import Button from "./ui/Button";
import Card from "./ui/Card";
import { FileText, Tag, MessageSquare, AlertTriangle } from "lucide-react";
import "./CreateJiraTicketForm.css";

const CreateJiraTicketForm = ({ onTicketCreated }) => {
=======
import { useState } from "react";
import "./CreateJiraTicketForm.css"; // 💡 link to our CSS file

export default function CreateJiraTicketForm({ onTicketCreated }) {
>>>>>>> 3e0cddf5af44c378e561d6f6c28dd324ebd0d7f4
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

<<<<<<< HEAD
    try {
      const response = await fetch("http://localhost:5000/api/jira/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add CORS headers if needed
          "Accept": "application/json",
        },
        body: JSON.stringify({
          summary,
          description,
          projectKey: "ECS", // Replace with your actual key
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLoading(false);

        if (result.success) {
          setStatus(`✅ Ticket Created: ${result.issueKey}`);
          setSummary("");
          setDescription("");
          if (onTicketCreated) onTicketCreated();
        } else {
          setStatus(`❌ Failed to create ticket: ${result.error || 'Unknown error'}`);
          console.error('Failed to create ticket:', result);
        }
      } else {
        // Backend server not available
        setStatus(`⚠️ Backend server not available. Ticket would be created in real Jira when server is running.`);
        setSummary("");
        setDescription("");
        if (onTicketCreated) onTicketCreated();
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setStatus(`⚠️ Backend server not available. Ticket would be created in real Jira when server is running.`);
      setLoading(false);
=======
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
>>>>>>> 3e0cddf5af44c378e561d6f6c28dd324ebd0d7f4
    }
  };

  return (
<<<<<<< HEAD
    <Card variant="blue" className="p-6">
      <h2 className="text-xl font-display font-semibold mb-4 flex items-center">
        <FileText size={20} className="mr-2 text-accent-blue" />
        Create Jira Ticket
      </h2>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 mb-4 rounded-lg ${
            status.includes('❌') ? 'bg-red-500/20 border border-red-500/30 text-red-300' : 
            status.includes('⚠️') ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-300' :
            'bg-accent-green/20 border border-accent-green/30 text-accent-green-light'
          } flex items-center`}
        >
          <span className="text-sm">{status}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="summary" className="block text-sm text-text-secondary mb-1">
            Summary
          </label>
          <div className="relative">
            <Tag size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
            <input
              id="summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-background-lighter border border-white/10 rounded-lg py-2 pl-10 pr-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
              placeholder="Brief summary of the ticket"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm text-text-secondary mb-1">
            Description
          </label>
          <div className="relative">
            <MessageSquare size={16} className="absolute left-3 top-3 text-text-muted" />
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background-lighter border border-white/10 rounded-lg py-2 pl-10 pr-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 min-h-[100px]"
              placeholder="Detailed description of the ticket"
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            Create Ticket
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CreateJiraTicketForm;
=======
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
>>>>>>> 3e0cddf5af44c378e561d6f6c28dd324ebd0d7f4
