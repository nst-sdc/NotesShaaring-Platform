import React, { useState } from "react"
import {
  FaDownload,
  FaEye,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaBookOpen,
} from "react-icons/fa"

const mockNotes = [
  {
    id: 1,
    title: "Advanced Data Structures and Algorithms",
    subject: "Data Structures and Algorithms (DSA)",
    uploadedBy: "Aarav Mehta",
    uploadDate: "2024-01-15",
    fileType: "PDF",
    pages: 45,
    downloads: 234,
  },
  {
    id: 2,
    title: "Web App Dev Basics",
    subject: "Web Application Programming (WAP)",
    uploadedBy: "Ishita Roy",
    uploadDate: "2024-02-05",
    fileType: "PDF",
    pages: 54,
    downloads: 150,
  },
  {
    id: 3,
    title: "Linear Algebra Refresher",
    subject: "Mathematics",
    uploadedBy: "Nikhil Sharma",
    uploadDate: "2024-01-22",
    fileType: "PDF",
    pages: 38,
    downloads: 112,
  },
  {
    id: 4,
    title: "Problem Solving with Python - Week 1",
    subject: "Problem Solving with Python (PSP)",
    uploadedBy: "Sneha Verma",
    uploadDate: "2024-03-10",
    fileType: "PDF",
    pages: 29,
    downloads: 197,
  },
  {
    id: 5,
    title: "S&W - Introduction to systems and Workflows",
    subject: "S&W",
    uploadedBy: "Rahul Gupta",
    uploadDate: "2024-03-18",
    fileType: "PDF",
    pages: 18,
    downloads: 98,
  },
]


const subjects = [
  "All Subjects",
  "Data Structures and Algorithms (DSA)",
  "Web Application Programming (WAP)",
  "Mathematics",
  "Problem Solving with Python (PSP)",
  "S&W"
]

export default function NotesBrowsingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("All Subjects")
  const [sortBy, setSortBy] = useState("newest")

  const filteredNotes = mockNotes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSubject = selectedSubject === "All Subjects" || note.subject === selectedSubject
      return matchesSearch && matchesSubject
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.uploadDate) - new Date(a.uploadDate)
        case "oldest":
          return new Date(a.uploadDate) - new Date(b.uploadDate)
        case "popular":
          return b.downloads - a.downloads
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6 font-sans">
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
            <option key={subj} value={subj}>{subj}</option>
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
        Showing {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
        {selectedSubject !== "All Subjects" && ` in ${selectedSubject}`}
        {searchTerm && ` matching "${searchTerm}"`}
      </p>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {filteredNotes.map((note) => (
          <div key={note.id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
            <div className="flex justify-between text-sm text-slate-500 mb-2">
              <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                <FaBookOpen /> {note.subject}
              </span>
              <span>{note.pages} pages</span>
            </div>

            <h3 className="text-base font-semibold text-slate-800 mb-2">{note.title}</h3>

            <p className="text-sm text-slate-600 flex items-center gap-1 mb-1">
              <FaUser /> {note.uploadedBy}
            </p>
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <FaCalendarAlt /> {formatDate(note.uploadDate)}
            </p>

            <div className="flex justify-between text-xs text-slate-400 mt-3">
              <span>{note.downloads} downloads</span>
              <span>{note.fileType}</span>
            </div>

            <div className="flex gap-2 mt-4">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition font-medium">
  <FaEye />
  View
</button>

              <button
                type="button"
                onClick={() => alert("Downloading...")}
                className="flex-1 px-3 py-2 rounded-md text-white font-medium transition-transform duration-200 hover:scale-105 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#5A67D8"}
                onMouseLeave={(e) => e.currentTarget.style.background = "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)"}
              >
                <div className="flex items-center justify-center gap-2">
                  <FaDownload /> Download
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

