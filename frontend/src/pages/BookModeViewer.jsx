import React, { useEffect, useState, useRef } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import HTMLFlipBook from 'react-pageflip';
import {
  X, Bookmark, CornerDownLeft, ChevronLeft, ChevronRight, ZoomIn, ZoomOut
} from 'lucide-react';
import axios from 'axios';

GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const BookModeViewer = ({ fileUrl, userId, noteId, onClose }) => {
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); 
  const [jumpTo, setJumpTo] = useState('');
  const [savedPages, setSavedPages] = useState([]);
  const [zoom, setZoom] = useState(1);
  const bookRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchMarks = async () => {
      if (!userId || !noteId) return;
      try {
        const res = await axios.get(`${BACKEND_URL}/api/marks/${userId}/${noteId}`);
        setSavedPages(res.data.markedPages || []);
      } catch (err) {
        console.error("❌ Failed to load marked pages:", err);
      }
    };
    fetchMarks();
  }, [userId, noteId]);

  const saveMarks = async (updatedMarks) => {
    try {
      await axios.post(`${BACKEND_URL}/api/marks`, {
        userId,
        noteId,
        markedPages: updatedMarks,
      });
    } catch (err) {
      console.error("❌ Failed to save marks:", err);
    }
  };

  // ✅ Load PDF and render pages
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const loadingTask = getDocument(fileUrl);
        const pdf = await loadingTask.promise;
        const canvasPages = [];

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          await page.render({ canvasContext: context, viewport }).promise;
          canvasPages.push(canvas.toDataURL());
        }

        setPages(canvasPages);
      } catch (err) {
        console.error("❌ Failed to load PDF:", err);
      }
    };
    loadPdf();
  }, [fileUrl]);

  const handleFlip = (e) => setCurrentPage(e.data + 1); 

  const handleJump = () => {
    const page = parseInt(jumpTo);
    if (!isNaN(page) && page >= 1 && page <= pages.length) {
      bookRef.current?.pageFlip().flip(page - 1);
    }
  };

  const toggleMarkPage = async () => {
    const updated =
      savedPages.includes(currentPage)
        ? savedPages.filter(p => p !== currentPage)
        : [...savedPages, currentPage];
    setSavedPages(updated);
    await saveMarks(updated);
  };

  const zoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const zoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-xl overflow-hidden relative flex flex-col">
        <button onClick={onClose} className="absolute top-2 right-2 text-red-600 text-xl z-50">
          <X />
        </button>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 items-center bg-black/60 px-4 py-2 rounded-full text-white">
          <button onClick={zoomOut}><ZoomOut className="w-5 h-5" /></button>
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn}><ZoomIn className="w-5 h-5" /></button>
        </div>
        <div className="flex-grow flex items-center justify-center overflow-hidden">
          {pages.length > 0 ? (
            <HTMLFlipBook
              ref={bookRef}
              width={550}
              height={750}
              size="stretch"
              drawShadow
              flippingTime={500}
              maxShadowOpacity={0.5}
              showCover={false}
              mobileScrollSupport
              onFlip={handleFlip}
              className="mx-auto"
            >
              {pages.map((src, idx) => {
                const pageNumber = idx + 1;
                return (
                  <div key={idx} className="page bg-white relative overflow-auto">
                    <img
                      src={src}
                      alt={`Page ${pageNumber}`}
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                      }}
                      className={`w-full h-full object-contain transition-transform duration-200 ${
                        currentPage === pageNumber ? 'ring-4 ring-green-500' : ''
                      }`}
                    />
                    {savedPages.includes(pageNumber) && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 text-xs rounded shadow">
                        Marked
                      </div>
                    )}
                  </div>
                );
              })}
            </HTMLFlipBook>
          ) : (
            <div className="text-gray-500">Loading PDF...</div>
          )}
        </div>
        <div className="bg-gray-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t relative">
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">
              Page {currentPage} / {pages.length}
            </span>
            <button
              onClick={toggleMarkPage}
              className={`flex items-center gap-1 px-3 py-1 text-sm ${
                savedPages.includes(currentPage)
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-yellow-500 hover:bg-yellow-600'
              } text-white rounded transition`}
            >
              <Bookmark className="w-4 h-4" />
              {savedPages.includes(currentPage) ? 'Unmark' : 'Mark Page'}
            </button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex gap-6 z-10">
            <button
              onClick={() => bookRef.current?.pageFlip().flipPrev()}
              className="p-2 bg-gray-800 hover:bg-gray-600 text-white rounded-full shadow"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => bookRef.current?.pageFlip().flipNext()}
              className="p-2 bg-gray-800 hover:bg-gray-600 text-white rounded-full shadow"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max={pages.length}
              value={jumpTo}
              onChange={(e) => setJumpTo(e.target.value)}
              placeholder="Go to page..."
              className="px-3 py-2 border rounded w-32 focus:ring focus:outline-none text-black"
            />
            <button
              onClick={handleJump}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              <CornerDownLeft className="w-4 h-4" /> Jump
            </button>

            {savedPages.length > 0 && (
              <>
                <label className="text-gray-700 text-sm font-medium">Go to marked:</label>
                <select
                  onChange={(e) => {
                    const page = parseInt(e.target.value, 10);
                    if (!isNaN(page)) {
                      bookRef.current?.pageFlip().flip(page - 1);
                    }
                  }}
                  className="px-3 py-2 border text-black rounded focus:ring focus:outline-none text-sm"
                >
                  <option value="">Select</option>
                  {savedPages.map((pageNum) => (
                    <option key={pageNum} value={pageNum}>
                      Page {pageNum}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookModeViewer;
