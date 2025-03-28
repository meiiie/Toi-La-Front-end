import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Award, Briefcase } from 'lucide-react';

interface Candidate {
  name: string;
  age: number;
  party: string;
  background: string;
}

const CandidateCard = ({
  candidate,
  onVote,
}: {
  candidate: Candidate;
  onVote: (candidate: Candidate) => void;
}) => {
  return (
    <Card className="w-full rounded-xl shadow-md hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-blue-700 dark:text-blue-300">
          {candidate.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            <span>Tuổi: {candidate.age}</span>
          </div>
          <div className="flex items-center">
            <Award className="h-4 w-4 mr-2" />
            <span>Đảng phái: {candidate.party}</span>
          </div>
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            <span>Nghề nghiệp: {candidate.background}</span>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={() => onVote(candidate)} className="w-full">
            Bầu chọn
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateCard;
