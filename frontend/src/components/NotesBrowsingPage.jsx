import React, { useState, useEffect } from "react";
import {
  FaDownload,
  FaEye,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaBookOpen,
  FaFilePdf,
  FaTrashAlt,
} from "react-icons/fa";

const NotesBrowsingPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");
  const [sortBy, setSortBy] = useState("newest");

  const currentUser = JSON.parse(localStorage.getItem("user")); // 👈 get current user

  // Fetch notes from API
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch("/api/notes");
        if (!response.ok) {
          throw new Error("Failed to fetch notes");
        }
        const data = await response.json();
        setNotes(data.notes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleDelete = async (noteId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this note?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setNotes((prevNotes) => prevNotes.filter((n) => n._id !== noteId));
      alert("✅ Note deleted successfully");
    } catch (err) {
      console.error("❌ Delete failed:", err.message);
      alert("Failed to delete note");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const extractSubjects = () => {
    const subjectsSet = new Set();
    notes.forEach((note) => {
      if (note.subject) {
        subjectsSet.add(note.subject);
      }
    });
    return ["All Subjects", ...Array.from(subjectsSet)];
  };

  const subjects = extractSubjects();

  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.subject && note.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (note.uploadedBy?.username &&
          note.uploadedBy.username.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSubject =
        selectedSubject === "All Subjects" || note.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "popular":
          return (b.downloadCount || 0) - (a.downloadCount || 0);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen p-6 font-sans flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-lg text-purple-600">Loading notes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 font-sans flex justify-center items-center">
        <div className="text-center p-4 bg-red-100 rounded-lg max-w-md">
          <h3 className="text-red-600 font-bold">Error loading notes</h3>
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6 font-sans"
      style={{
        background: "linear-gradient(to bottom right, #f0e9ff, #e9d5ff, #fce7f3)",
      }}
    >
      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#667EEA] to-[#764BA2] bg-clip-text text-transparent">
        Browse Notes
      </h1>

      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl mb-6 items-center shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 rounded-md px-3 py-2 flex-1">
          <FaSearch className="text-slate-400" />
          <input
            type="text"
            placeholder="Search notes by title, subject, or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none flex-1 text-base"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="p-2 border border-slate-300 rounded-md text-sm"
        >
          {subjects.map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="popular">Most Popular</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      <p className="text-slate-600 mb-4">
        Showing {filteredNotes.length}{" "}
        {filteredNotes.length === 1 ? "note" : "notes"}
        {selectedSubject !== "All Subjects" && ` in ${selectedSubject}`}
        {searchTerm && ` matching "${searchTerm}"`}
      </p>

      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <FaFilePdf className="mx-auto text-4xl text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-700">No notes found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {filteredNotes.map((note) => (
            <div
              key={note._id}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                  <FaBookOpen /> {note.subject || "Uncategorized"}
                </span>
                <span>{note.pageCount || "N/A"} pages</span>
              </div>

              <h3 className="text-base font-semibold text-slate-800 mb-2">
                {note.title}
              </h3>

              <p className="text-sm text-slate-600 flex items-center gap-1 mb-1">
                <FaUser /> {note.uploadedBy?.username || "Anonymous"}
              </p>
              <p className="text-sm text-slate-600 flex items-center gap-1">
                <FaCalendarAlt /> {formatDate(note.createdAt)}
              </p>

              <div className="flex justify-between text-xs text-slate-400 mt-3">
                <span>{note.downloadCount || 0} downloads</span>
                <span>PDF</span>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition font-medium">
                  <FaEye />
                  View
                </button>

                <button
                  onClick={() => {
                    window.open(note.fileUrl, "_blank");
                  }}
                  className="flex-1 px-3 py-2 rounded-md text-white font-medium transition-transform duration-200 hover:scale-105 shadow-md"
                  style={{
                    background:
                      "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FaDownload /> Download
                  </div>
                </button>
              </div>

              {note?.uploadedBy?._id === currentUser?._id && (
                <button
                  onClick={() => handleDelete(note._id)}
                  className="w-full mt-3 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition text-sm flex items-center justify-center gap-2"
                >
                  <FaTrashAlt />
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesBrowsingPage;
