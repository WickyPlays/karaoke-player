import { Button } from '@mui/material';
import './ConfirmExit.scss';
import { useEffect } from 'react';

interface ConfirmExitProps {
  onClose: () => void;
}

export default function ConfirmExit({ onClose }: ConfirmExitProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="confirm-exit-overlay">
      <div className="confirm-exit">  
        <div className="confirm-exit-content">
          <p className='subtitle'>Are you sure you want to exit?</p>
          <div className="confirm-exit-buttons">
            <Button 
              className="btn-option" 
              variant="contained" 
              href='/'
              onClick={onClose}
            >
              Yes
            </Button>
            <Button 
              className="btn-option" 
              variant="outlined"
              onClick={onClose}
            >
              No
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}