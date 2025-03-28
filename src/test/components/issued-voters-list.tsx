import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';
import { CheckCircle } from 'lucide-react';

interface IssuedVotersListProps {
  voters: Array<{
    address: string;
    tokenId: string;
    status: string;
  }>;
}

export default function IssuedVotersList({ voters }: IssuedVotersListProps) {
  if (voters.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">Chưa có cử tri nào được cấp phiếu bầu</div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Địa Chỉ Cử Tri</TableHead>
            <TableHead className="text-center">Token ID</TableHead>
            <TableHead className="text-center">Trạng Thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {voters.map((voter, index) => (
            <TableRow key={index}>
              <TableCell className="font-mono">
                {voter.address.substring(0, 6)}...{voter.address.substring(38)}
              </TableCell>
              <TableCell className="text-center">{voter.tokenId}</TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
