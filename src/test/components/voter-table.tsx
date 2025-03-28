import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { Checkbox } from '../../components/ui/Checkbox';

interface VoterTableProps {
  voters: Array<{
    address: string;
    name: string;
    id: string;
  }>;
  selectedVoters: Set<string>;
  onSelectVoter: (address: string, checked: boolean) => void;
}

export default function VoterTable({ voters, selectedVoters, onSelectVoter }: VoterTableProps) {
  if (voters.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">Không có cử tri nào trong danh sách</div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Chọn</TableHead>
            <TableHead>Địa Chỉ</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead className="text-center">ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voters.map((voter) => (
            <TableRow key={voter.address}>
              <TableCell>
                <Checkbox
                  checked={selectedVoters.has(voter.address)}
                  onCheckedChange={(checked) => onSelectVoter(voter.address, checked as boolean)}
                />
              </TableCell>
              <TableCell className="font-mono">
                {voter.address.substring(0, 6)}...{voter.address.substring(38)}
              </TableCell>
              <TableCell>{voter.name}</TableCell>
              <TableCell className="text-center">{voter.id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
