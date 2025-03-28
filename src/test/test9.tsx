import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/Dialog';
import { Button } from '../components/ui/Button';

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  candidate: { name: string } | null;
}

const VotingModal: React.FC<VotingModalProps> = ({ isOpen, onClose, onConfirm, candidate }) => {
  if (!candidate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận bầu chọn</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>Bạn có chắc chắn muốn bầu cho ứng cử viên:</p>
          <p className="font-bold text-lg mt-2">{candidate.name}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onConfirm}>Xác nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VotingModal;
