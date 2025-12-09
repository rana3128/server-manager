import React from 'react';
import { createPortal } from 'react-dom';
import './DeleteConfirmModal.css';

function DeleteConfirmModal({ projectName, onConfirm, onCancel }) {
  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚠️ Confirm Delete</h3>
        </div>
        
        <div className="modal-body">
          <p>Are you sure you want to delete this project?</p>
          <div className="project-name-highlight">
            <strong>{projectName}</strong>
          </div>
          <p className="warning-text">
            This will only remove the project from the dashboard. 
            The actual files on the server will remain unchanged.
          </p>
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-delete" onClick={onConfirm}>
            Delete Project
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default DeleteConfirmModal;
