import React, { useState, useRef } from "react";

export default function NotesUploadPage() {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fileInputRef.current.files[0]) {
      alert("Please upload a file before submitting.");
      return;
    }

    console.log({
      title,
      subject,
      description,
      file: fileInputRef.current.files[0],
    });

    setTitle("");
    setSubject("");
    setDescription("");
    fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br  from-slate-100 to-slate-200 p-6 font-sans flex justify-center items-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-3xl p-10 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-700">Upload Your Notes</h1>
          <p className="text-gray-500 mt-2">
            Help others by sharing your academic notes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter note title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter subject (e.g., Mathematics)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Add a brief description of your notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-gray-50"
              />
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  ref={fileInputRef}
                  required
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Accepted formats: PDF, DOC, DOCX
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 text-white text-lg font-semibold rounded-xl transition duration-300 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-purple-600 hover:to-indigo-600 shadow-md hover:shadow-lg"
          >
            Upload Notes
          </button>
        </form>
      </div>
    </div>
  );
}
