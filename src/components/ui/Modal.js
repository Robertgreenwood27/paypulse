// src/components/ui/Modal.js
'use client';

import React from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-lg rounded-lg bg-gray-800 p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white text-2xl leading-none"
          aria-label="Close modal"
        >
          ×
        </button>

        {title && (
          <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        )}

        <div className="text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
}