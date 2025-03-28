import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Calendar } from 'lucide-react';

interface ElectionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
  } | null;
}

const ElectionInfoModal: React.FC<ElectionInfoModalProps> = ({ isOpen, onClose, election }) => {
  if (!election) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thông tin cuộc bầu cử</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <h3 className="text-lg font-semibold mb-2">{election.name}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{election.description}</p>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              Thời gian: {election.startDate} - {election.endDate}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ElectionInfoModal;
